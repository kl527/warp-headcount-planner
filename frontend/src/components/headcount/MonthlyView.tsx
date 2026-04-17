import { FONT_FAMILIES, HEADING_SPECS } from '../../constants/design';
import {
  MONTH_LABELS,
  STATUS_COLOR,
  TEAM_COLOR,
  hiresForMonth,
  hiresForYear,
  monthKey,
  type Hire,
  type HireStatus,
  type Team,
} from '../../data/headcount';
import { BreakdownPanel, type BreakdownRow } from './BreakdownPanel';
import { HireList } from './HireList';

interface MonthlyViewProps {
  hires: Hire[];
  focusedMonthKey: string;
  year: number;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function MonthlyView({
  hires,
  focusedMonthKey,
  year,
  onPrev,
  onNext,
  onBack,
}: MonthlyViewProps) {
  const [, monthStr] = focusedMonthKey.split('-');
  const monthIndex = Number(monthStr) - 1;
  const monthHires = hiresForMonth(hires, focusedMonthKey);

  const teamCounts = new Map<Team, number>();
  const statusCounts = new Map<HireStatus, number>();
  for (const h of monthHires) {
    teamCounts.set(h.team, (teamCounts.get(h.team) ?? 0) + 1);
    statusCounts.set(h.status, (statusCounts.get(h.status) ?? 0) + 1);
  }

  const teamRows: BreakdownRow[] = Array.from(teamCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([team, count]) => ({
      label: team,
      value: count,
      swatch: TEAM_COLOR[team].dot,
    }));

  const statusOrder: HireStatus[] = ['filled', 'accepted', 'open', 'planned'];
  const statusRows: BreakdownRow[] = statusOrder
    .filter((s) => (statusCounts.get(s) ?? 0) > 0)
    .map((s) => ({
      label: STATUS_COLOR[s].label,
      value: statusCounts.get(s) ?? 0,
      swatch: STATUS_COLOR[s].fg,
    }));

  // cumulative headcount through this month (counts filled + accepted as secured)
  const ytdHires = hiresForYear(hires, year).filter(
    (h) => h.startMonth <= focusedMonthKey,
  );
  const cumulativeRows: BreakdownRow[] = [];
  for (let i = 0; i <= monthIndex; i++) {
    const key = monthKey(year, i);
    const count = ytdHires.filter((h) => h.startMonth === key).length;
    cumulativeRows.push({
      label: MONTH_LABELS[i].slice(0, 3),
      value: count,
      swatch: 'var(--color-accent-10)',
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-[20px]">
        <button
          onClick={onBack}
          style={{
            fontSize: 13,
            lineHeight: '20px',
            color: 'var(--color-gray-11)',
            fontWeight: 450,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          ← Back to year
        </button>
        <div className="flex items-center gap-[8px]">
          <StepperButton label="‹" onClick={onPrev} />
          <StepperButton label="›" onClick={onNext} />
        </div>
      </div>

      <h2
        className="mb-[28px]"
        style={{
          fontFamily: HEADING_SPECS.h2LedeBold.font,
          fontSize: HEADING_SPECS.h2LedeBold.size,
          lineHeight: `${HEADING_SPECS.h2LedeBold.lineHeight}px`,
          fontWeight: HEADING_SPECS.h2LedeBold.weight,
          letterSpacing: HEADING_SPECS.h2LedeBold.tracking,
        }}
      >
        <span style={{ color: HEADING_SPECS.h2LedeBold.color }}>
          {MONTH_LABELS[monthIndex]} {year}.
        </span>{' '}
        <span style={{ color: HEADING_SPECS.h2Section.color }}>
          {monthHires.length === 0
            ? 'No hires scheduled.'
            : `${monthHires.length} ${
                monthHires.length === 1 ? 'hire' : 'hires'
              } planned.`}
        </span>
      </h2>

      <div className="grid grid-cols-1 laptop:grid-cols-[1fr_380px] gap-[28px]">
        <div>
          <SectionEyebrow>Roles</SectionEyebrow>
          <HireList hires={monthHires} />
        </div>
        <div className="flex flex-col gap-[16px]">
          <BreakdownPanel title="By team" rows={teamRows} />
          <BreakdownPanel title="By status" rows={statusRows} />
          <BreakdownPanel title="Cumulative YTD" rows={cumulativeRows} />
        </div>
      </div>
    </div>
  );
}

function StepperButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center cursor-pointer"
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'var(--color-card)',
        boxShadow: '0 0 0 1px #00000014',
        color: 'var(--color-gray-12)',
        fontFamily: FONT_FAMILIES.brand,
        fontSize: 18,
        lineHeight: 1,
      }}
      aria-label={label === '‹' ? 'Previous month' : 'Next month'}
    >
      {label}
    </button>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        lineHeight: '16px',
        color: 'var(--color-gray-10)',
        fontWeight: 500,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}
