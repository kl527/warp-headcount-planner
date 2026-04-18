import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import { MONTH_LABELS, TEAM_COLOR, type Hire } from '../../data/headcount';

interface MonthCardProps {
  monthIndex: number;
  hires: Hire[];
}

export function MonthCard({ monthIndex, hires }: MonthCardProps) {
  return (
    <div
      style={{
        minHeight: 200,
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

      {hires.length > 0 && (
        <div className="flex flex-col gap-[3px] min-w-0">
          {hires.map((h) => {
            const tone = TEAM_COLOR[h.team];
            return (
              <div
                key={h.id}
                className="truncate"
                title={h.role}
                style={{
                  fontFamily: FONT_FAMILIES.sans,
                  fontSize: 10,
                  lineHeight: '14px',
                  fontWeight: 500,
                  color: tone.fg,
                  background: tone.bg,
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {h.role}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
