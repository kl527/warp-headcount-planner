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
  type RoleFamily,
} from '../../lib/salaryApi';
import { useResolvedLocation } from '../../lib/geoApi';
import { DragGhost } from './DragGhost';
import { DropZone } from './DropZone';
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
import { ShareButton } from './ShareButton';
import { useRoleDnd, type DropResult } from './roleDnd';
import { type View } from './ViewToggle';
import { YearCard } from './YearCard';

const HORIZON_YEARS = 4;
const HORIZON_MONTHS = HORIZON_YEARS * 12;
const BASE_YEAR = 2026;

function defaultMonthlyExpenses(): MonthlyExpenseValues {
  return {
    rent: 5000,
    ads: 5000,
    tools: 5000,
    custom: [{ id: nanoid(8), label: '', value: 0 }],
  };
}

type PlacedRole = { startMonth: number; annualUsd: number };

function maxP50(family: RoleFamily): number {
  let max = 0;
  for (const band of Object.values(family.levels)) {
    if (band && band.p50 > max) max = band.p50;
  }
  return max;
}

function annualForRoleKey(
  roleKey: string,
  families: RoleFamily[] | null,
  multiplier: number,
  overrides: Record<string, number>,
): number {
  const override = overrides[roleKey];
  if (override !== undefined) return override;
  if (!families) return 0;
  const family = families.find((f) => f.key === roleKey);
  return family ? Math.round(maxP50(family) * multiplier) : 0;
}

interface SeriesInput {
  startingCash: number;
  baselineBurn: number;
  baseMrr: number;
  momGrowthPct: number;
  roles: PlacedRole[];
}

interface SeriesResult {
  balances: number[]; // length HORIZON_MONTHS, cash at start of each month
  endOfMonthBalances: number[]; // length HORIZON_MONTHS, cash at end of each month
  runwayMonths: number | null; // null = never goes to zero within horizon
}

function computeSeries(input: SeriesInput): SeriesResult {
  const series: number[] = [];
  let cash = input.startingCash;
  series.push(cash);
  const growth = 1 + input.momGrowthPct / 100;
  for (let m = 0; m < HORIZON_MONTHS; m++) {
    const revenue = input.baseMrr * Math.pow(growth, m);
    let roleBurn = 0;
    for (const r of input.roles) {
      if (r.startMonth <= m) roleBurn += r.annualUsd / 12;
    }
    cash = cash - input.baselineBurn - roleBurn + revenue;
    series.push(cash);
  }

  let runwayMonths: number | null = null;
  if (series[0] <= 0) {
    runwayMonths = 0;
  } else {
    for (let m = 1; m < series.length; m++) {
      if (series[m] <= 0) {
        const prev = series[m - 1];
        const curr = series[m];
        runwayMonths = m - 1 + prev / (prev - curr);
        break;
      }
    }
  }

  return {
    balances: series.slice(0, HORIZON_MONTHS),
    endOfMonthBalances: series.slice(1, HORIZON_MONTHS + 1),
    runwayMonths,
  };
}

interface ShareableState {
  financials: FinancialInputs;
  expenseValues: MonthlyExpenseValues;
  assignments: Record<number, MonthAssignment[]>;
  roleSalaryOverrides: Record<string, number>;
  view: View;
  focusedYear: number;
  manualLocation: LocationKey | null;
}

function stripAssignments(
  assignments: Record<number, MonthAssignment[]>,
): Record<number, MonthAssignment[]> {
  const out: Record<number, MonthAssignment[]> = {};
  for (const [k, list] of Object.entries(assignments)) {
    out[Number(k)] = list.map((a) => {
      const { flipFrom, ...rest } = a;
      void flipFrom;
      return rest;
    });
  }
  return out;
}

function encodeState(state: ShareableState): string {
  const json = JSON.stringify({
    financials: state.financials,
    expenseValues: state.expenseValues,
    assignments: stripAssignments(state.assignments),
    roleSalaryOverrides: state.roleSalaryOverrides,
    view: state.view,
    focusedYear: state.focusedYear,
    manualLocation: state.manualLocation,
  });
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeState(encoded: string): Partial<ShareableState> | null {
  try {
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
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
  const { registerMonth, setDropHandler, drag } = useRoleDnd();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('state')) return;
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
  }, []);

  const handleRoleSalaryChange = useCallback(
    (roleKey: string, annualUsd: number) => {
      setRoleSalaryOverrides((prev) => ({ ...prev, [roleKey]: annualUsd }));
    },
    [],
  );

  const locationMultiplier = locationsMap?.[selectedLocation] ?? 1;

  const baselineBurn =
    expenseValues.rent +
    expenseValues.ads +
    expenseValues.tools +
    expenseValues.custom.reduce((sum, c) => sum + c.value, 0);

  const placedRoles: PlacedRole[] = [];
  for (const [monthStr, list] of Object.entries(assignments)) {
    const startMonth = Number(monthStr);
    for (const a of list) {
      placedRoles.push({
        startMonth,
        annualUsd: annualForRoleKey(
          a.roleKey,
          families,
          locationMultiplier,
          roleSalaryOverrides,
        ),
      });
    }
  }

  const { balances: monthlyBalances, endOfMonthBalances, runwayMonths } =
    computeSeries({
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

  const buildShareUrl = useCallback(() => {
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
    return `${origin}${pathname}?state=${encoded}`;
  }, [
    financials,
    expenseValues,
    assignments,
    roleSalaryOverrides,
    view,
    focusedYear,
    manualLocation,
  ]);

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
          <div className="flex flex-col justify-between gap-[36px] flex-1 min-w-0 w-full">
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
                Understand your{' '}
                <span style={{ fontWeight: 700 }}>Runway</span>
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
                drag &amp; drop your excel sheet or type in your company
                financials and we&rsquo;ll give you an accurate runway
              </p>
            </header>
            <DropZone />
          </div>

          <div className="w-full tablet:w-[340px] laptop:w-[400px] xl:w-[466px] tablet:flex-shrink-0">
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
          onViewChange={setView}
          viewToggleAccessory={<ShareButton onShare={buildShareUrl} />}
        />

        <section className="mt-[16px] flex flex-row gap-[10px] laptop:gap-[21px] items-stretch">
          <EdgeTab
            active={view === 'runway'}
            side="left"
            label="Costs"
            icon={<PanelLeftOpen size={14} strokeWidth={2} />}
            onClick={() => setView('month')}
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
            onClick={() => setView('runway')}
          />
        </section>
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
