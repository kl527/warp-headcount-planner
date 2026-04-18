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

const HORIZON_MONTHS = 12;

const DEFAULT_MONTHLY_EXPENSES: MonthlyExpenseValues = {
  rent: 5000,
  ads: 5000,
  tools: 5000,
  input: 0,
};

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

  return { balances: series.slice(0, HORIZON_MONTHS), runwayMonths };
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
    DEFAULT_MONTHLY_EXPENSES,
  );
  const [assignments, setAssignments] = useState<
    Record<number, MonthAssignment[]>
  >({});
  const { registerMonth, setDropHandler, drag } = useRoleDnd();

  const catalogState = useSalaryCatalog();
  const families =
    catalogState.status === 'ready' ? catalogState.catalog.families : null;

  const baselineBurn =
    expenseValues.rent +
    expenseValues.ads +
    expenseValues.tools +
    expenseValues.input;

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

  const { balances: monthlyBalances, runwayMonths } = computeSeries({
    startingCash: financials.companyBalance,
    baselineBurn,
    baseMrr: financials.mrr,
    momGrowthPct: financials.momGrowthPct,
    roles: placedRoles,
  });

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

  const handleDrop = useCallback((result: DropResult) => {
    const { target, card, source, ghostRect } = result;

    // Sidebar → month: add a fresh pill that FLIPs in from the cursor.
    if (source.kind === 'sidebar') {
      if (target === null) return;
      const entry: MonthAssignment = {
        id: nanoid(8),
        roleKey: card.roleKey,
        label: card.label,
        team: card.team,
        flipFrom: ghostRect,
      };
      setAssignments((prev) => {
        const cur = prev[target] ?? [];
        return { ...prev, [target]: [...cur, entry] };
      });
      return;
    }

    // source.kind === 'month'
    const fromMonth = source.monthIndex;
    const fromId = source.assignmentId;

    if (target === null) {
      // Dropped outside any month → delete.
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

    if (target === fromMonth) {
      // Same month → noop; the ghost fades and the pill reveals itself.
      return;
    }

    // Move across months: remove from source, append to target w/ FLIP.
    setAssignments((prev) => {
      const src = prev[fromMonth] ?? [];
      const moving = src.find((a) => a.id === fromId);
      if (!moving) return prev;
      const dst = prev[target] ?? [];
      return {
        ...prev,
        [fromMonth]: src.filter((a) => a.id !== fromId),
        [target]: [...dst, { ...moving, flipFrom: ghostRect }],
      };
    });
  }, []);

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
        />

        <section className="mt-[16px] flex flex-row gap-[10px] laptop:gap-[21px] items-stretch">
          <ExpensesSidebar
            expenseValues={expenseValues}
            onExpenseChange={handleExpenseChange}
          />

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 tablet:grid-cols-3 xl:grid-cols-4 gap-[14px]">
              {Array.from({ length: 12 }).map((_, idx) => (
                <MonthCard
                  key={idx}
                  monthIndex={idx}
                  balanceUsd={monthlyBalances[idx]}
                  assignments={assignments[idx]}
                  isDropTarget={drag?.armed && drag.dropTarget === idx}
                  onRegister={registerMonth}
                  onFlipDone={handleFlipDone}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
