import { useState } from 'react';
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
  currentMonthKey,
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
  const nowKey = currentMonthKey();

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
      <TopBar year={year} onPrevYear={() => setYear(year - 1)} onNextYear={() => setYear(year + 1)} />

      <main
        className="mx-auto w-full px-[24px] tablet:px-[32px] laptop:px-[48px] py-[40px] laptop:py-[64px] flex flex-col gap-[36px]"
        style={{ maxWidth: PAGE_WIDTH.max }}
      >
        <header className="flex flex-col gap-[20px] laptop:flex-row laptop:items-end laptop:justify-between">
          <div>
            <div
              style={{
                fontSize: 13,
                lineHeight: '18px',
                color: 'var(--color-gray-10)',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              {year} plan
            </div>
            <h1
              style={{
                fontFamily: HEADING_SPECS.h1Hero.font,
                fontSize: HEADING_SPECS.h1Hero.size,
                lineHeight: `${HEADING_SPECS.h1Hero.lineHeight}px`,
                fontWeight: HEADING_SPECS.h1Hero.weight,
                color: HEADING_SPECS.h1Hero.color,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Headcount plan.
            </h1>
            <p
              className="mt-[8px]"
              style={{
                fontFamily: HEADING_SPECS.heroSubtext.font,
                fontSize: HEADING_SPECS.heroSubtext.size,
                lineHeight: `${HEADING_SPECS.heroSubtext.lineHeight}px`,
                fontWeight: HEADING_SPECS.heroSubtext.weight,
                color: HEADING_SPECS.heroSubtext.color,
                maxWidth: 520,
                margin: 0,
              }}
            >
              Track planned hires, open reqs, and committed spend across the
              year. Toggle into any month for the detail view.
            </p>
          </div>
          <div className="flex items-center gap-[12px]">
            <ViewToggle value={view} onChange={setView} />
            <AddHireButton />
          </div>
        </header>

        <StatRow hires={yearHires} />

        {view === 'year' ? (
          <YearlyView
            hires={yearHires}
            year={year}
            currentMonthKey={nowKey}
            onMonthClick={goToMonth}
          />
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

function TopBar({
  year,
  onPrevYear,
  onNextYear,
}: {
  year: number;
  onPrevYear: () => void;
  onNextYear: () => void;
}) {
  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between px-[24px] tablet:px-[32px] laptop:px-[48px]"
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
      <div
        className="flex items-center gap-[6px]"
        style={{
          fontFamily: FONT_FAMILIES.brand,
          fontSize: 14,
          lineHeight: '20px',
          fontWeight: 500,
          color: 'var(--color-gray-12)',
        }}
      >
        <button
          onClick={onPrevYear}
          aria-label="Previous year"
          className="inline-flex items-center justify-center cursor-pointer"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            color: 'var(--color-gray-11)',
          }}
        >
          ‹
        </button>
        <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 48, textAlign: 'center' }}>{year}</span>
        <button
          onClick={onNextYear}
          aria-label="Next year"
          className="inline-flex items-center justify-center cursor-pointer"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            color: 'var(--color-gray-11)',
          }}
        >
          ›
        </button>
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

function AddHireButton() {
  return (
    <button
      className="inline-flex items-center justify-center cursor-pointer"
      style={{
        background: BRAND_CTA.bg,
        color: BRAND_CTA.fg,
        height: 32,
        padding: '0 14px',
        borderRadius: 8,
        fontSize: 14,
        lineHeight: '20px',
        fontWeight: 450,
      }}
    >
      + Add hire
    </button>
  );
}
