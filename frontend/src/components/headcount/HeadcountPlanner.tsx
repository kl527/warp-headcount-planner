import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BRAND_CTA,
  FONT_FAMILIES,
  HEADER,
  HEADING_SPECS,
  PAGE_WIDTH,
  RADIUS,
} from '../../constants/design';
import {
  HIRES,
  PLAN_YEAR,
  hiresForYear,
  monthKey,
} from '../../data/headcount';
import { StatRow } from './StatRow';
import { ViewToggle, type View } from './ViewToggle';
import { YearlyView } from './YearlyView';
import { MonthlyView } from './MonthlyView';

export function HeadcountPlanner() {
  const [year, setYear] = useState(PLAN_YEAR);
  const [view, setView] = useState<View>('year');
  const [focusedMonth, setFocusedMonth] = useState<string>(
    monthKey(PLAN_YEAR, new Date().getMonth()),
  );

  const yearHires = hiresForYear(HIRES, year);

  const goToMonth = (key: string) => {
    setFocusedMonth(key);
    setView('month');
  };

  const shiftMonth = (delta: number) => {
    const [, m] = focusedMonth.split('-');
    const idx = Number(m) - 1 + delta;
    let nextYear = year;
    let nextIdx = idx;
    if (idx < 0) {
      nextYear = year - 1;
      nextIdx = 11;
    } else if (idx > 11) {
      nextYear = year + 1;
      nextIdx = 0;
    }
    setYear(nextYear);
    setFocusedMonth(monthKey(nextYear, nextIdx));
  };

  return (
    <div className="flex flex-col min-h-svh">
      <TopBar />
      <SubNav
        year={year}
        view={view}
        onPrevYear={() => setYear(year - 1)}
        onNextYear={() => setYear(year + 1)}
        onChangeView={setView}
      />

      <main
        className="mx-auto w-full px-[24px] tablet:px-[32px] laptop:px-[48px] py-[24px] laptop:py-[32px] flex flex-col gap-[24px]"
        style={{ maxWidth: PAGE_WIDTH.max }}
      >
        <header className="flex flex-col gap-[4px]">
          <h2
            style={{
              fontFamily: HEADING_SPECS.h2LedeBold.font,
              fontSize: 28,
              lineHeight: '34px',
              fontWeight: 700,
              letterSpacing: '-0.018em',
              margin: 0,
              color: HEADING_SPECS.h2LedeBold.color,
            }}
          >
            Headcount plan
          </h2>
        </header>

        <StatRow hires={yearHires} />

        {view === 'year' ? (
          <YearlyView year={year} onMonthClick={goToMonth} />
        ) : (
          <MonthlyView
            hires={yearHires}
            focusedMonthKey={focusedMonth}
            year={year}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            onBack={() => setView('year')}
          />
        )}
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between px-[24px] tablet:px-[32px] laptop:px-[48px]"
      style={{
        height: HEADER.height,
        background: HEADER.background,
        backdropFilter: 'saturate(180%) blur(12px)',
        WebkitBackdropFilter: 'saturate(180%) blur(12px)',
        boxShadow: 'inset 0 -1px 0 rgba(0, 0, 0, 0.09)',
      }}
    >
      <div className="flex items-center gap-[12px]">
        <BrandMark />
        <span
          style={{
            fontFamily: FONT_FAMILIES.brand,
            fontSize: 15,
            lineHeight: '20px',
            fontWeight: 500,
            color: 'var(--color-gray-12)',
            letterSpacing: '-0.01em',
          }}
        >
          Headcount
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILIES.mono,
            fontSize: 12,
            lineHeight: '16px',
            color: 'var(--color-gray-9)',
            letterSpacing: '0.04em',
            padding: '2px 8px',
            borderRadius: RADIUS.md,
            boxShadow: 'inset 0 0 0 1px #00000014',
          }}
        >
          PLAN
        </span>
      </div>
    </div>
  );
}

function SubNav({
  year,
  view,
  onPrevYear,
  onNextYear,
  onChangeView,
}: {
  year: number;
  view: View;
  onPrevYear: () => void;
  onNextYear: () => void;
  onChangeView: (v: View) => void;
}) {
  return (
    <div
      className="sticky z-10 flex items-center justify-between px-[24px] tablet:px-[32px] laptop:px-[48px]"
      style={{
        top: HEADER.height,
        height: 52,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(10px)',
        WebkitBackdropFilter: 'saturate(180%) blur(10px)',
        boxShadow: 'inset 0 -1px 0 rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        className="flex items-center gap-[4px]"
        style={{
          fontFamily: FONT_FAMILIES.brand,
          fontSize: 14,
          lineHeight: '20px',
          fontWeight: 500,
          color: 'var(--color-gray-12)',
        }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onPrevYear}
          aria-label="Previous year"
        >
          <ChevronLeft />
        </Button>
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            minWidth: 48,
            textAlign: 'center',
          }}
        >
          {year}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNextYear}
          aria-label="Next year"
        >
          <ChevronRight />
        </Button>
      </div>
      <div className="flex items-center gap-[10px]">
        <ViewToggle value={view} onChange={onChangeView} />
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center"
      style={{
        width: 26,
        height: 26,
        borderRadius: 7,
        background: BRAND_CTA.bg,
        color: BRAND_CTA.fg,
        fontFamily: FONT_FAMILIES.brand,
        fontSize: 14,
        lineHeight: 1,
        fontWeight: 600,
        letterSpacing: '-0.03em',
      }}
    >
      w
    </span>
  );
}
