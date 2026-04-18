import { CalendarRange, TrendingDown } from 'lucide-react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import type { MonthAssignment } from './RolePill';
import { RunwayChart } from './RunwayChart';
import { RunwayRemainingPill } from './RunwayCard';

interface RunwayPanelProps {
  runwayMonths: number | null;
  balances: number[];
  assignments: Record<number, MonthAssignment[]>;
  baseYear: number;
  focusedYearIndex: number;
}

function ChartHeader({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#f5fcf3',
        borderRadius: 20,
        height: 21,
        padding: '0 12px',
        fontFamily: FONT_FAMILIES.sans,
        fontSize: 10,
        fontWeight: 600,
        color: '#008500',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden style={{ display: 'inline-flex' }}>
        {icon}
      </span>
      {text}
    </span>
  );
}

export function RunwayPanel({
  runwayMonths,
  balances,
  assignments,
  baseYear,
  focusedYearIndex,
}: RunwayPanelProps) {
  const focusStart = focusedYearIndex * 12;
  const focusYear = baseYear + focusedYearIndex;
  const focusBalances = balances.slice(focusStart, focusStart + 12);
  const horizonYears = Math.max(1, Math.round(balances.length / 12));
  const lastYear = baseYear + horizonYears - 1;

  return (
    <aside
      className="flex-shrink-0"
      style={{
        width: '100%',
        maxWidth: 318,
        background: '#f9f9f9',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        padding: '19px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 15,
          fontWeight: 500,
          color: '#000',
        }}
      >
        Runway
      </span>

      <RunwayRemainingPill runwayMonths={runwayMonths} />

      <div
        style={{
          background: '#fff',
          border: '0.5px solid #f9f9f9',
          borderRadius: RADIUS.lg,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          padding: '14px 14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 200,
        }}
      >
        <ChartHeader
          icon={<TrendingDown size={11} strokeWidth={2.2} />}
          text={`${baseYear}–${lastYear} cash runway`}
        />
        <div style={{ flex: 1, minHeight: 170 }}>
          <RunwayChart
            balances={balances}
            assignments={assignments}
            baseYear={baseYear}
            startMonthIndex={0}
            xTickMode="year"
            showYAxis
          />
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          border: '0.5px solid #f9f9f9',
          borderRadius: RADIUS.lg,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          padding: '14px 14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 190,
        }}
      >
        <ChartHeader
          icon={<CalendarRange size={11} strokeWidth={2.2} />}
          text={`${focusYear} monthly cash`}
        />
        <div style={{ flex: 1, minHeight: 160 }}>
          <RunwayChart
            balances={focusBalances}
            assignments={assignments}
            baseYear={baseYear}
            startMonthIndex={focusStart}
            xTickMode="month"
            showYAxis
          />
        </div>
      </div>
    </aside>
  );
}
