import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import { MONTH_LABELS } from '../../data/headcount';

interface MonthCardProps {
  monthIndex: number;
  balanceUsd?: number;
}

function fmtBalance(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n <= -1_000_000) return `-$${(-n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  if (n <= -1_000) return `-$${Math.round(-n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

export function MonthCard({ monthIndex, balanceUsd }: MonthCardProps) {
  return (
    <div
      className="min-h-[120px] tablet:min-h-[190px] laptop:min-h-[220px]"
      style={{
        background: '#fff',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 14,
          fontWeight: 500,
          color: '#000',
        }}
      >
        {MONTH_LABELS[monthIndex]}
      </div>

      <div
        className="truncate"
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 10,
          lineHeight: '14px',
          fontWeight: 500,
          color: 'rgba(0, 0, 0, 0.72)',
          background: '#f2f2f2',
          padding: '2px 6px',
          borderRadius: 4,
        }}
      >
        monthly expenses.
      </div>

      {balanceUsd !== undefined && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5fcf3',
              borderRadius: 20,
              height: 30,
              padding: '0 14px',
              fontFamily: FONT_FAMILIES.sans,
              fontSize: 12,
              fontWeight: 600,
              color: '#008500',
              whiteSpace: 'nowrap',
            }}
          >
            {fmtBalance(balanceUsd)}
          </span>
        </div>
      )}
    </div>
  );
}
