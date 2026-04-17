import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HEADING_SPECS } from '../../constants/design';
import {
  MONTH_LABELS,
  TEAM_COLOR,
  hiresForMonth,
  type Hire,
  type Team,
} from '../../data/headcount';
import { BreakdownPanel, type BreakdownRow } from './BreakdownPanel';

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
  for (const h of monthHires) {
    teamCounts.set(h.team, (teamCounts.get(h.team) ?? 0) + 1);
  }

  const teamRows: BreakdownRow[] = Array.from(teamCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([team, count]) => ({
      label: team,
      value: count,
      swatch: TEAM_COLOR[team].dot,
    }));

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

      <div className="max-w-[380px]">
        <BreakdownPanel title="By team" rows={teamRows} />
      </div>
    </div>
  );
}
