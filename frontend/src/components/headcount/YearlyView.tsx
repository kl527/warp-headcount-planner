import { RADIUS, SHADOWS } from '../../constants/design';
import { monthKey } from '../../data/headcount';
import { MonthCard } from './MonthCard';

interface YearlyViewProps {
  year: number;
  onMonthClick: (key: string) => void;
}

export function YearlyView({ year, onMonthClick }: YearlyViewProps) {
  return (
    <div
      className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3 xl:grid-cols-4 gap-px overflow-hidden"
      style={{
        background: 'oklch(0 0 0 / 0.06)',
        borderRadius: RADIUS.xl,
        boxShadow: SHADOWS.borderMedium,
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => {
        const key = monthKey(year, i);
        return (
          <MonthCard
            key={key}
            monthIndex={i}
            onClick={() => onMonthClick(key)}
          />
        );
      })}
    </div>
  );
}
