import {
  hiresForMonth,
  monthKey,
  type Hire,
} from '../../data/headcount';
import { MonthCard } from './MonthCard';

interface YearlyViewProps {
  hires: Hire[];
  year: number;
  currentMonthKey: string;
  onMonthClick: (key: string) => void;
}

export function YearlyView({
  hires,
  year,
  currentMonthKey,
  onMonthClick,
}: YearlyViewProps) {
  return (
    <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3 xl:grid-cols-4 gap-[12px]">
      {Array.from({ length: 12 }).map((_, i) => {
        const key = monthKey(year, i);
        const monthHires = hiresForMonth(hires, key);
        return (
          <MonthCard
            key={key}
            monthIndex={i}
            year={year}
            hires={monthHires}
            isCurrent={key === currentMonthKey}
            onClick={() => onMonthClick(key)}
          />
        );
      })}
    </div>
  );
}
