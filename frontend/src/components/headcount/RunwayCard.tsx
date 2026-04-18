import { TrendingDown } from 'lucide-react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import type { MonthAssignment } from './RolePill';
import { RunwayChart } from './RunwayChart';

interface RunwayCardProps {
  runwayMonths: number | null;
  balances: number[];
  assignments: Record<number, MonthAssignment[]>;
  baseYear: number;
}

function fmtRunway(runwayMonths: number | null): {
  text: string;
  color: string;
} {
  if (runwayMonths === null)
    return { text: 'Cash flow positive', color: '#008500' };
  if (runwayMonths <= 0) return { text: '0 Months', color: '#e21200' };
  if (runwayMonths >= 12) return { text: '12+ Months', color: '#008500' };
  return { text: `${runwayMonths.toFixed(1)} Months`, color: '#e21200' };
}

export function RunwayRemainingPill({
  runwayMonths,
  minHeight = 105,
  labelSize = 18,
  valueSize = 35,
  padding = '15px 26px',
}: {
  runwayMonths: number | null;
  minHeight?: number;
  labelSize?: number;
  valueSize?: number;
  padding?: string;
}) {
  const { text, color } = fmtRunway(runwayMonths);
  const isLongText = runwayMonths === null;
  const effectiveValueSize = isLongText ? Math.round(valueSize * 0.6) : valueSize;
  return (
    <div
      style={{
        minHeight,
        background: '#fff',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        padding,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: labelSize,
          lineHeight: `${Math.round(labelSize * 1.5)}px`,
          color: 'rgba(0, 0, 0, 0.61)',
        }}
      >
        runway remaining
      </span>
      <span
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: effectiveValueSize,
          lineHeight: `${Math.round(effectiveValueSize * 1.2)}px`,
          fontWeight: 700,
          color,
        }}
      >
        {text}
      </span>
    </div>
  );
}

export function RunwayCard({
  runwayMonths,
  balances,
  assignments,
  baseYear,
}: RunwayCardProps) {
  const horizonYears = Math.max(1, Math.round(balances.length / 12));
  const lastYear = baseYear + horizonYears - 1;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 466,
        minHeight: 386,
        background: '#f9f9f9',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      <RunwayRemainingPill runwayMonths={runwayMonths} />

      <div
        style={{
          flex: 1,
          minHeight: 225,
          background: '#fff',
          border: '0.5px solid #f9f9f9',
          borderRadius: RADIUS.lg,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          padding: '17px 20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#f5fcf3',
            borderRadius: 20,
            height: 21,
            padding: '0 14px',
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 10,
            fontWeight: 600,
            color: '#008500',
            whiteSpace: 'nowrap',
          }}
        >
          <TrendingDown size={11} strokeWidth={2.2} aria-hidden />
          {`${baseYear}–${lastYear} cash runway`}
        </span>

        <div style={{ flex: 1, marginTop: 14, minHeight: 140 }}>
          <RunwayChart
            balances={balances}
            assignments={assignments}
            baseYear={baseYear}
            xTickMode="year"
            showYAxis
          />
        </div>
      </div>
    </div>
  );
}
