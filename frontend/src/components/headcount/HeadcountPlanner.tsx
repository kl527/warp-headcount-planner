import { ChevronLeft, ChevronRight } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useState } from 'react';
import { FONT_FAMILIES, PAGE_WIDTH } from '../../constants/design';
import { useSalaryCatalog, type RoleFamily } from '../../lib/salaryApi';
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
import { RoleDndProvider } from './RoleDndProvider';
import { useRoleDnd, type DropResult } from './roleDnd';
import { type View } from './ViewToggle';
import { YearCard } from './YearCard';

const HORIZON_MONTHS = 48;
const HORIZON_YEARS = 4;

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
): number {
  if (!families) return 0;
  const family = families.find((f) => f.key === roleKey);
  return family ? maxP50(family) : 0;
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

export function HeadcountPlanner() {
  return (
    <RoleDndProvider>
      <PlannerInner />
      <DragGhost />
    </RoleDndProvider>
  );
}

function PlannerInner() {
  const [financials, setFinancials] = useState<FinancialInputs>({
    companyBalance: 1_000_000,
    mrr: 150_000,
    momGrowthPct: 20,
  });
  const [expenseValues, setExpenseValues] = useState<MonthlyExpenseValues>(
    defaultMonthlyExpenses,
  );
  const [assignments, setAssignments] = useState<
    Record<number, MonthAssignment[]>
  >({});
  const [view, setView] = useState<View>('month');
  const [focusedYear, setFocusedYear] = useState<number>(0);
  const { registerMonth, setDropHandler, drag } = useRoleDnd();

  const baseYear = new Date().getFullYear();

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
        annualUsd: annualForRoleKey(a.roleKey, families),
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
            <RunwayCard runwayMonths={runwayMonths} />
          </div>
        </section>

        <FinancialInputsRow
          values={financials}
          onChange={handleFinancialsChange}
          view={view}
          onViewChange={setView}
        />

        <section className="mt-[16px] flex flex-row gap-[10px] laptop:gap-[21px] items-stretch">
          <ExpensesSidebar
            expenseValues={expenseValues}
            onExpenseChange={handleExpenseChange}
            view={view}
          />

          <div className="flex-1 min-w-0 flex flex-col gap-[14px]">
            {view === 'month' ? (
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
            ) : (
              <div className="flex flex-col gap-[14px]">
                {Array.from({ length: HORIZON_YEARS }).map((_, y) => (
                  <YearCard
                    key={y}
                    yearIndex={y}
                    balanceUsd={yearlyBalances[y]}
                    assignments={yearAssignments[y]}
                    isDropTarget={drag?.armed && drag.dropTarget === y}
                    onRegister={registerMonth}
                    onFlipDone={handleFlipDone}
                    onSelect={handleYearSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
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
