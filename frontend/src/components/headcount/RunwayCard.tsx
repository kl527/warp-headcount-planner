import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import type { MonthAssignment } from './RolePill';
import { RunwayCardStack } from './RunwayCardStack';

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
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 466,
        background: '#f9f9f9',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      <RunwayRemainingPill runwayMonths={runwayMonths} />
      <RunwayCardStack
        balances={balances}
        assignments={assignments}
        baseYear={baseYear}
      />
    </div>
  );
}
