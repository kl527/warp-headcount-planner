import {
  ChevronLeft,
  ChevronRight,
  PanelLeftOpen,
  PanelRightOpen,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useState } from 'react';
import { FONT_FAMILIES, PAGE_WIDTH, RADIUS } from '../../constants/design';
import {
  useSalaryCatalog,
  type LocationKey,
} from '../../lib/salaryApi';
import { useResolvedLocation } from '../../lib/geoApi';
import { DragGhost } from './DragGhost';
import {
  ExpensesSidebar,
  type MonthlyExpenseValues,
} from './ExpensesSidebar';
import {
  FinancialInputsRow,
  type FinancialInputs,
} from './FinancialInputsRow';
import { MonthCard } from './MonthCard';
import { type MonthAssignment } from './RolePill';
import { RunwayCard } from './RunwayCard';
import { RunwayPanel } from './RunwayPanel';
import { RoleDndProvider } from './RoleDndProvider';
import { buildDeckEmailHtml } from '../../lib/emailDeck';
import { ShareButton, type SendDeckResult } from './ShareButton';
import { CompareStrip, type SavedScenario } from './CompareStrip';
import { useRoleDnd, type DropResult } from './roleDnd';
import { type View } from './ViewToggle';
import {
  HORIZON_YEARS,
  computeSeries,
  placedRolesFromAssignments,
  baselineBurnFromExpenses,
} from '../../lib/scenarioMath';
import {
  encodeState,
  decodeState,
  type ShareableState,
} from '../../lib/shareState';
import { YearCard } from './YearCard';
import { posthog } from '../../lib/posthog';

const BASE_YEAR = 2026;

const SHUFFLE_WORDS = ['Runway', 'Headcount'] as const;

function ShuffleWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % SHUFFLE_WORDS.length);
        setVisible(true);
      }, 220);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      style={{
        fontWeight: 700,
        display: 'inline-block',
        transition: 'opacity 220ms ease, transform 220ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
      }}
    >
      {SHUFFLE_WORDS[index]}
    </span>
  );
}

function defaultMonthlyExpenses(): MonthlyExpenseValues {
  return {
    rent: 5000,
    ads: 5000,
    tools: 5000,
    custom: [{ id: nanoid(8), label: '', value: 0 }],
  };
}

function readInitialState(): Partial<ShareableState> | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('state');
  if (!raw) return null;
  return decodeState(raw);
}

export function HeadcountPlanner() {
  return (
    <RoleDndProvider>
      <PlannerInner />
      <DragGhost />
    </RoleDndProvider>
  );
}

function PlannerInner() {
  const [initial] = useState<Partial<ShareableState> | null>(readInitialState);
  const [financials, setFinancials] = useState<FinancialInputs>(
    () =>
      initial?.financials ?? {
        companyBalance: 1_000_000,
        mrr: 150_000,
        momGrowthPct: 7,
      },
  );
  const [expenseValues, setExpenseValues] = useState<MonthlyExpenseValues>(
    () => initial?.expenseValues ?? defaultMonthlyExpenses(),
  );
  const [assignments, setAssignments] = useState<
    Record<number, MonthAssignment[]>
  >(() => initial?.assignments ?? {});
  const [roleSalaryOverrides, setRoleSalaryOverrides] = useState<
    Record<string, number>
  >(() => initial?.roleSalaryOverrides ?? {});
  const [view, setView] = useState<View>(() => initial?.view ?? 'month');
  const [focusedYear, setFocusedYear] = useState<number>(
    () => initial?.focusedYear ?? 0,
  );
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[] | null>(
    null,
  );
  const [preLoadSnapshot, setPreLoadSnapshot] = useState<ShareableState | null>(
    null,
  );
  const { registerMonth, setDropHandler, drag } = useRoleDnd();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('state')) return;
    posthog.capture('share_link_opened');
    params.delete('state');
    const qs = params.toString();
    const next =
      window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    window.history.replaceState({}, '', next);
  }, []);

  const baseYear = BASE_YEAR;

  const handleYearSelect = useCallback((yearIndex: number) => {
    setFocusedYear(yearIndex);
    setView('month');
    posthog.capture('view_changed', { view: 'month', trigger: 'year_select' });
  }, []);

  const stepYear = (delta: number) => {
    setFocusedYear((y) => Math.min(HORIZON_YEARS - 1, Math.max(0, y + delta)));
  };

  const catalogState = useSalaryCatalog();
  const families =
    catalogState.status === 'ready' ? catalogState.catalog.families : null;
  const locationsMap =
    catalogState.status === 'ready' ? catalogState.catalog.locations : null;

  const detectedLocation = useResolvedLocation();
  const [manualLocation, setManualLocation] = useState<LocationKey | null>(
    () => initial?.manualLocation ?? null,
  );
  const selectedLocation: LocationKey =
    manualLocation ?? detectedLocation ?? 'SF';

  const handleLocationChange = useCallback((next: LocationKey) => {
    setManualLocation(next);
    posthog.capture('location_changed', { location: next });
  }, []);

  const handleRoleSalaryChange = useCallback(
    (roleKey: string, annualUsd: number) => {
      setRoleSalaryOverrides((prev) => ({ ...prev, [roleKey]: annualUsd }));
    },
    [],
  );

  const locationMultiplier = locationsMap?.[selectedLocation] ?? 1;

  const baselineBurn = baselineBurnFromExpenses(expenseValues);

  const placedRoles = placedRolesFromAssignments(
    assignments,
    families,
    locationMultiplier,
    roleSalaryOverrides,
  );

  const {
    balances: monthlyBalances,
    endOfMonthBalances,
    roleBurnByMonth,
    monthlyRevenue,
    runwayMonths,
  } = computeSeries({
    startingCash: financials.companyBalance,
    baselineBurn,
    baseMrr: financials.mrr,
    momGrowthPct: financials.momGrowthPct,
    roles: placedRoles,
  });

  const yearlyBalances: number[] = [];
  for (let y = 0; y < HORIZON_YEARS; y++) {
    yearlyBalances.push(endOfMonthBalances[(y + 1) * 12 - 1]);
  }

  const yearAssignments: MonthAssignment[][] = Array.from(
    { length: HORIZON_YEARS },
    () => [],
  );
  for (const [monthStr, list] of Object.entries(assignments)) {
    const startYear = Math.floor(Number(monthStr) / 12);
    for (let y = startYear; y < HORIZON_YEARS; y++) {
      yearAssignments[y].push(...list);
    }
  }

  const handleFinancialsChange = useCallback(
    (patch: Partial<FinancialInputs>) => {
      setFinancials((prev) => ({ ...prev, ...patch }));
      posthog.capture('financial_inputs_changed', { fields: Object.keys(patch) });
    },
    [],
  );

  const handleExpenseChange = useCallback(
    (patch: Partial<MonthlyExpenseValues>) => {
      setExpenseValues((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const handleDrop = useCallback(
    (result: DropResult) => {
      const { target, card, source, ghostRect } = result;

      // In yearly view the `target` index is a year (0..HORIZON_YEARS-1).
      // Translate it to the first month of that year for storage.
      const targetMonth =
        target === null ? null : view === 'year' ? target * 12 : target;

      // Sidebar → month: add a fresh pill that FLIPs in from the cursor.
      if (source.kind === 'sidebar') {
        if (targetMonth === null) return;
        const entry: MonthAssignment = {
          id: nanoid(8),
          roleKey: card.roleKey,
          label: card.label,
          team: card.team,
          flipFrom: ghostRect,
        };
        setAssignments((prev) => {
          const cur = prev[targetMonth] ?? [];
          return { ...prev, [targetMonth]: [...cur, entry] };
        });
        posthog.capture('role_added', {
          role_key: card.roleKey,
          team: card.team,
          month_index: targetMonth,
          view,
        });
        return;
      }

      // source.kind === 'month'
      const fromMonth = source.monthIndex;
      const fromId = source.assignmentId;

      if (targetMonth === null) {
        setAssignments((prev) => {
          const cur = prev[fromMonth];
          if (!cur) return prev;
          return {
            ...prev,
            [fromMonth]: cur.filter((a) => a.id !== fromId),
          };
        });
        posthog.capture('role_removed', {
          role_key: card.roleKey,
          team: card.team,
          from_month_index: fromMonth,
        });
        return;
      }

      // In year view, dropping back onto the same year is a no-op.
      const sameSlot =
        view === 'year'
          ? Math.floor(fromMonth / 12) === Math.floor(targetMonth / 12)
          : targetMonth === fromMonth;
      if (sameSlot) return;

      setAssignments((prev) => {
        const src = prev[fromMonth] ?? [];
        const moving = src.find((a) => a.id === fromId);
        if (!moving) return prev;
        const dst = prev[targetMonth] ?? [];
        return {
          ...prev,
          [fromMonth]: src.filter((a) => a.id !== fromId),
          [targetMonth]: [...dst, { ...moving, flipFrom: ghostRect }],
        };
      });
      posthog.capture('role_moved', {
        role_key: card.roleKey,
        team: card.team,
        from_month_index: fromMonth,
        to_month_index: targetMonth,
        view,
      });
    },
    [view],
  );

  const handleFlipDone = useCallback((assignmentId: string) => {
    setAssignments((prev) => {
      const next: Record<number, MonthAssignment[]> = {};
      for (const [k, list] of Object.entries(prev)) {
        next[Number(k)] = list.map((a) =>
          a.id === assignmentId && a.flipFrom
            ? { ...a, flipFrom: undefined }
            : a,
        );
      }
      return next;
    });
  }, []);

  useEffect(() => {
    setDropHandler(handleDrop);
    return () => setDropHandler(null);
  }, [handleDrop, setDropHandler]);

  const buildShareDeck = useCallback<
    () => Promise<SendDeckResult>
  >(async () => {
    const encoded = encodeState({
      financials,
      expenseValues,
      assignments,
      roleSalaryOverrides,
      view,
      focusedYear,
      manualLocation,
    });
    const { origin, pathname } = window.location;
    const url = `${origin}${pathname}?state=${encoded}`;
    const { subject, html } = await buildDeckEmailHtml({
      shareUrl: url,
      baseYear,
      horizonYears: HORIZON_YEARS,
      startingCash: financials.companyBalance,
      runwayMonths,
      monthlyBalances,
      endOfMonthBalances,
      roleBurnByMonth,
      monthlyRevenue,
      baselineBurnMonthly: baselineBurn,
      assignments,
      focusedYearIndex: focusedYear,
    });
    const scenarioName = `Plan · ${new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date())}`;
    return { url, subject, html, scenarioName };
  }, [
    financials,
    expenseValues,
    assignments,
    roleSalaryOverrides,
    view,
    focusedYear,
    manualLocation,
    baseYear,
    runwayMonths,
    monthlyBalances,
    endOfMonthBalances,
    roleBurnByMonth,
    monthlyRevenue,
    baselineBurn,
  ]);

  const applyState = useCallback((state: Partial<ShareableState>) => {
    if (state.financials) setFinancials(state.financials);
    if (state.expenseValues) setExpenseValues(state.expenseValues);
    if (state.assignments) setAssignments(state.assignments);
    if (state.roleSalaryOverrides) {
      setRoleSalaryOverrides(state.roleSalaryOverrides);
    }
    if (state.view) setView(state.view);
    if (typeof state.focusedYear === 'number') {
      setFocusedYear(state.focusedYear);
    }
    if (state.manualLocation !== undefined) {
      setManualLocation(state.manualLocation);
    }
  }, []);

  const handleLoadScenario = useCallback(
    (state: Partial<ShareableState>) => {
      setPreLoadSnapshot((prev) =>
        // Don't clobber an earlier snapshot — revert always returns to the
        // state the user had before the first Load in this chain.
        prev ?? {
          financials,
          expenseValues,
          assignments,
          roleSalaryOverrides,
          view,
          focusedYear,
          manualLocation,
        },
      );
      applyState(state);
      posthog.capture('scenario_loaded');
    },
    [
      applyState,
      financials,
      expenseValues,
      assignments,
      roleSalaryOverrides,
      view,
      focusedYear,
      manualLocation,
    ],
  );

  const handleRevertLoad = useCallback(() => {
    if (!preLoadSnapshot) return;
    applyState(preLoadSnapshot);
    setPreLoadSnapshot(null);
    posthog.capture('scenario_reverted');
  }, [applyState, preLoadSnapshot]);

  const handleScenarioSent = useCallback(
    (entry: { name: string; shareUrl: string; createdAt: string }) => {
      setSavedScenarios((prev) =>
        prev === null
          ? prev
          : [
              {
                id: -Date.now(), // local placeholder — backend id arrives on next fetch
                name: entry.name,
                shareUrl: entry.shareUrl,
                createdAt: entry.createdAt,
              },
              ...prev,
            ],
      );
    },
    [],
  );

  const handleSavedScenariosChange = useCallback(
    (next: SavedScenario[] | null) => {
      setSavedScenarios(next);
    },
    [],
  );

  const handleViewChange = useCallback((next: View) => {
    setView(next);
    posthog.capture('view_changed', { view: next });
  }, []);

  return (
    <div className="min-h-svh">
      <main
        className="mx-auto w-full py-[48px] laptop:py-[64px] flex flex-col gap-[20px]"
        style={{
          maxWidth: PAGE_WIDTH.max,
          paddingInline: 'clamp(16px, calc((100vw - 1040px) / 2), 120px)',
        }}
      >
        <section className="flex flex-col tablet:flex-row gap-[32px] items-stretch mb-[56px]">
          <div className="flex flex-col justify-start gap-[36px] flex-1 min-w-0 w-full">
            <header className="flex flex-col gap-[18px]">
              <h1
                style={{
                  fontFamily: FONT_FAMILIES.sans,
                  fontSize: 48,
                  lineHeight: '57.6px',
                  fontWeight: 500,
                  color: '#202020',
                  margin: 0,
                }}
              >
                Understand your
                <br />
                <ShuffleWord />

              </h1>
              <p
                style={{
                  fontFamily: FONT_FAMILIES.sans,
                  fontSize: 18,
                  lineHeight: '27px',
                  color: 'rgba(0, 0, 0, 0.61)',
                  maxWidth: 489,
                  margin: 0,
                }}
              >
                plan your hires month by month, enter your financials, and
                see exactly how each role shifts your runway
              </p>
            </header>
          </div>

          <div className="w-full tablet:w-[360px] laptop:w-[440px] xl:w-[520px] tablet:flex-shrink-0">
            <RunwayCard
              runwayMonths={runwayMonths}
              balances={monthlyBalances}
              assignments={assignments}
              baseYear={baseYear}
            />
          </div>
        </section>

        <FinancialInputsRow
          values={financials}
          onChange={handleFinancialsChange}
          view={view}
          onViewChange={handleViewChange}
          viewToggleAccessory={
            <ShareButton onShare={buildShareDeck} onSent={handleScenarioSent} />
          }
        />

        <section className="mt-[16px] flex flex-row gap-[10px] laptop:gap-[21px] items-stretch">
          <EdgeTab
            active={view === 'runway'}
            side="left"
            label="Costs"
            icon={<PanelLeftOpen size={14} strokeWidth={2} />}
            onClick={() => handleViewChange('month')}
          />

          <AnimatedSlot active={view !== 'runway'} from="left">
            <ExpensesSidebar
              expenseValues={expenseValues}
              onExpenseChange={handleExpenseChange}
              view={view}
              selectedLocation={selectedLocation}
              onLocationChange={handleLocationChange}
              roleSalaryOverrides={roleSalaryOverrides}
              onRoleSalaryChange={handleRoleSalaryChange}
            />
          </AnimatedSlot>

          <div className="flex-1 min-w-0 flex flex-col gap-[14px]">
            {view === 'year' ? (
              <div className="flex flex-col gap-[14px]">
                {Array.from({ length: HORIZON_YEARS }).map((_, y) => (
                  <YearCard
                    key={y}
                    yearIndex={y}
                    year={baseYear + y}
                    balanceUsd={yearlyBalances[y]}
                    assignments={yearAssignments[y]}
                    isDropTarget={drag?.armed && drag.dropTarget === y}
                    onRegister={registerMonth}
                    onFlipDone={handleFlipDone}
                    onSelect={handleYearSelect}
                  />
                ))}
              </div>
            ) : (
              <>
                <YearStepper
                  year={baseYear + focusedYear}
                  canPrev={focusedYear > 0}
                  canNext={focusedYear < HORIZON_YEARS - 1}
                  onPrev={() => stepYear(-1)}
                  onNext={() => stepYear(1)}
                />
                <div className="grid grid-cols-2 tablet:grid-cols-3 xl:grid-cols-4 gap-[14px]">
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const monthIndex = focusedYear * 12 + idx;
                    return (
                      <MonthCard
                        key={monthIndex}
                        monthIndex={monthIndex}
                        balanceUsd={monthlyBalances[monthIndex]}
                        assignments={assignments[monthIndex]}
                        isDropTarget={
                          drag?.armed && drag.dropTarget === monthIndex
                        }
                        onRegister={registerMonth}
                        onFlipDone={handleFlipDone}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <AnimatedSlot active={view === 'runway'} from="right">
            <RunwayPanel
              runwayMonths={runwayMonths}
              balances={monthlyBalances}
              assignments={assignments}
              baseYear={baseYear}
              focusedYearIndex={focusedYear}
            />
          </AnimatedSlot>

          <EdgeTab
            active={view !== 'runway'}
            side="right"
            label="Runway"
            icon={<PanelRightOpen size={14} strokeWidth={2} />}
            onClick={() => handleViewChange('runway')}
          />
        </section>

        <CompareStrip
          currentState={
            preLoadSnapshot ?? {
              financials,
              expenseValues,
              assignments,
              roleSalaryOverrides,
              view,
              focusedYear,
              manualLocation,
            }
          }
          families={families}
          locationMultiplier={locationMultiplier}
          locationsMap={locationsMap}
          detectedLocation={detectedLocation}
          savedScenarios={savedScenarios}
          onSavedScenariosChange={handleSavedScenariosChange}
          onLoad={handleLoadScenario}
          canRevert={preLoadSnapshot !== null}
          onRevert={handleRevertLoad}
        />
      </main>
    </div>
  );
}

const SLOT_WIDTH = 318;
const SLOT_DURATION_MS = 420;
// No-overshoot ease — keeps sibling widths monotonic so the flex-1 middle
// doesn't oscillate during a mode swap. Matches the ViewToggle pill ease.
const SLOT_SPRING = 'cubic-bezier(0.32, 0.72, 0, 1)';

function AnimatedSlot({
  active,
  from,
  children,
}: {
  active: boolean;
  from: 'left' | 'right';
  children: React.ReactNode;
}) {
  // Always rendered — lets both sides transition synchronously without the
  // extra rAF delay that mount-on-demand would introduce.
  const offset = from === 'left' ? -18 : 18;

  return (
    <div
      className="flex-shrink-0"
      aria-hidden={!active}
      style={{
        width: active ? SLOT_WIDTH : 0,
        minWidth: 0,
        overflow: 'hidden',
        pointerEvents: active ? 'auto' : 'none',
        transition: `width ${SLOT_DURATION_MS}ms ${SLOT_SPRING}`,
      }}
    >
      <div
        style={{
          width: SLOT_WIDTH,
          transform: active ? 'translateX(0)' : `translateX(${offset}px)`,
          opacity: active ? 1 : 0,
          transition: `transform ${SLOT_DURATION_MS}ms ${SLOT_SPRING}, opacity 220ms ease-out`,
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const EDGE_TAB_WIDTH = 28;

function EdgeTab({
  active,
  side,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  side: 'left' | 'right';
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const offset = side === 'left' ? -18 : 18;
  const radius = side === 'left'
    ? `0 ${RADIUS.lg} ${RADIUS.lg} 0`
    : `${RADIUS.lg} 0 0 ${RADIUS.lg}`;

  return (
    <div
      className="flex-shrink-0 self-stretch"
      style={{
        width: active ? EDGE_TAB_WIDTH : 0,
        minWidth: 0,
        overflow: 'hidden',
        pointerEvents: active ? 'auto' : 'none',
        transition: `width ${SLOT_DURATION_MS}ms ${SLOT_SPRING}`,
        display: 'flex',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open ${label}`}
        title={`Open ${label}`}
        style={{
          width: EDGE_TAB_WIDTH,
          minHeight: 120,
          alignSelf: 'center',
          background: '#f9f9f9',
          border: '0.5px solid #f0f0f0',
          borderLeftWidth: side === 'left' ? 0 : 0.5,
          borderRightWidth: side === 'right' ? 0 : 0.5,
          borderRadius: radius,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
          padding: '12px 0',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: '#3a3a3a',
          transform: active ? 'translateX(0)' : `translateX(${offset}px)`,
          opacity: active ? 1 : 0,
          transition: `transform ${SLOT_DURATION_MS}ms ${SLOT_SPRING}, opacity 220ms ease-out, background 160ms ease, color 160ms ease`,
          willChange: 'transform, opacity',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f1f1f1';
          e.currentTarget.style.color = '#000';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f9f9f9';
          e.currentTarget.style.color = '#3a3a3a';
        }}
      >
        <span style={{ display: 'inline-flex' }}>{icon}</span>
        <span
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'inherit',
          }}
        >
          {label}
        </span>
      </button>
    </div>
  );
}

function YearStepper({
  year,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  year: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const btn: React.CSSProperties = {
    width: 28,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    color: '#000',
    padding: 0,
  };
  return (
    <div
      className="inline-flex items-center"
      style={{
        gap: 6,
        alignSelf: 'flex-start',
        fontFamily: FONT_FAMILIES.sans,
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Previous year"
        style={{
          ...btn,
          cursor: canPrev ? 'pointer' : 'default',
          opacity: canPrev ? 1 : 0.3,
        }}
      >
        <ChevronLeft size={16} />
      </button>
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#000',
          minWidth: 48,
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {year}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next year"
        style={{
          ...btn,
          cursor: canNext ? 'pointer' : 'default',
          opacity: canNext ? 1 : 0.3,
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
