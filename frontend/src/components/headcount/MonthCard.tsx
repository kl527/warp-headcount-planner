import { FONT_FAMILIES } from '../../constants/design';
import { MONTH_LABELS } from '../../data/headcount';

interface MonthCardProps {
  monthIndex: number;
  onClick: () => void;
}

export function MonthCard({ monthIndex, onClick }: MonthCardProps) {
  return (
    <button
      onClick={onClick}
      className="text-left flex flex-col cursor-pointer transition-colors"
      style={{
        background: 'var(--color-card)',
        padding: '16px 18px',
        minHeight: 152,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 15,
          lineHeight: '20px',
          fontWeight: 500,
          color: 'var(--color-gray-12)',
        }}
      >
        {MONTH_LABELS[monthIndex]}
      </div>
    </button>
  );
}
