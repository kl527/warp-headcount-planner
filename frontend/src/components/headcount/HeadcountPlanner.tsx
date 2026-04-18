import { FONT_FAMILIES, PAGE_WIDTH } from '../../constants/design';
import {
  HIRES,
  PLAN_YEAR,
  hiresForMonth,
  hiresForYear,
  monthKey,
} from '../../data/headcount';
import { DropZone } from './DropZone';
import { ExpensesSidebar } from './ExpensesSidebar';
import { FinancialInputsRow } from './FinancialInputsRow';
import { MonthCard } from './MonthCard';
import { RunwayCard } from './RunwayCard';

export function HeadcountPlanner() {
  const yearHires = hiresForYear(HIRES, PLAN_YEAR);

  return (
    <div className="min-h-svh">
      <main
        className="mx-auto w-full py-[48px] laptop:py-[64px] flex flex-col gap-[20px]"
        style={{
          maxWidth: PAGE_WIDTH.max,
          paddingInline: 'clamp(16px, calc((100vw - 1040px) / 2), 120px)',
        }}
      >
        <section className="flex flex-col tablet:flex-row gap-[32px] items-stretch mb-[28px]">
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

        <section className="flex flex-row gap-[10px] laptop:gap-[21px] items-stretch">
          <ExpensesSidebar />

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 tablet:grid-cols-3 xl:grid-cols-4 gap-[14px]">
              {Array.from({ length: 12 }).map((_, idx) => (
                <MonthCard
                  key={idx}
                  monthIndex={idx}
                  hires={hiresForMonth(yearHires, monthKey(PLAN_YEAR, idx))}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
