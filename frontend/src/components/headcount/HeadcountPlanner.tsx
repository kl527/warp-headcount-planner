import { nanoid } from 'nanoid';
import { useCallback, useEffect, useState } from 'react';
import { FONT_FAMILIES, PAGE_WIDTH } from '../../constants/design';
import {
  HIRES,
  PLAN_YEAR,
  hiresForYear,
  type Hire,
} from '../../data/headcount';
import { DragGhost } from './DragGhost';
import { DropZone } from './DropZone';
import { ExpensesSidebar } from './ExpensesSidebar';
import { FinancialInputsRow } from './FinancialInputsRow';
import { MonthCard } from './MonthCard';
import { type MonthAssignment } from './RolePill';
import { RunwayCard } from './RunwayCard';
import { RoleDndProvider } from './RoleDndProvider';
import { useRoleDnd, type DropResult } from './roleDnd';

const STARTING_CASH = 2_000_000;
const BASELINE_MONTHLY_BURN = 30_000;

function computeMonthlyBalances(yearHires: Hire[]): number[] {
  const balances: number[] = [];
  let cash = STARTING_CASH;
  for (let m = 0; m < 12; m++) {
    balances.push(cash);
    let hireBurn = 0;
    for (const h of yearHires) {
      const startIdx = parseInt(h.startMonth.split('-')[1], 10) - 1;
      if (startIdx <= m) hireBurn += h.estCostUsd / 12;
    }
    cash -= BASELINE_MONTHLY_BURN + hireBurn;
  }
  return balances;
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
  const yearHires = hiresForYear(HIRES, PLAN_YEAR);
  const monthlyBalances = computeMonthlyBalances(yearHires);

  const [assignments, setAssignments] = useState<
    Record<number, MonthAssignment[]>
  >({});
  const { registerMonth, setDropHandler, drag } = useRoleDnd();

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
            <RunwayCard />
          </div>
        </section>

        <FinancialInputsRow />

        <section className="mt-[16px] flex flex-row gap-[10px] laptop:gap-[21px] items-stretch">
          <ExpensesSidebar />

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
