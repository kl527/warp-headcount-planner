import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HEADING_SPECS } from '../../constants/design';
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
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft data-icon="inline-start" />
          Back to year
        </Button>
        <div className="flex items-center gap-[6px]">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onPrev}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onNext}
            aria-label="Next month"
          >
            <ChevronRight />
          </Button>
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
