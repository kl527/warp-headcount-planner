import { RADIUS, SHADOWS } from '../../constants/design';

export interface BreakdownRow {
  label: string;
  value: number;
  swatch: string;
}

interface BreakdownPanelProps {
  title: string;
  rows: BreakdownRow[];
  total?: number;
}

export function BreakdownPanel({ title, rows, total }: BreakdownPanelProps) {
  const max = total ?? rows.reduce((s, r) => s + r.value, 0) ?? 1;
  return (
    <section
      style={{
        background: 'var(--color-card)',
        borderRadius: RADIUS.xl,
        boxShadow: SHADOWS.border,
        padding: '18px 20px',
      }}
    >
      <header
        style={{
          fontSize: 13,
          lineHeight: '18px',
          color: 'var(--color-gray-10)',
          fontWeight: 450,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        {title}
      </header>
      <div className="flex flex-col gap-[10px]">
        {rows.length === 0 && (
          <div
            style={{
              fontSize: 13,
              lineHeight: '18px',
              color: 'var(--color-gray-10)',
            }}
          >
            No data.
          </div>
        )}
        {rows.map((r) => {
          const pct = max > 0 ? (r.value / max) * 100 : 0;
          return (
            <div key={r.label} className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[8px]">
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: r.swatch,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      lineHeight: '20px',
                      color: 'var(--color-gray-12)',
                      fontWeight: 450,
                    }}
                  >
                    {r.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 14,
                    lineHeight: '20px',
                    color: 'var(--color-gray-11)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r.value}
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: RADIUS.xs,
                  background: 'var(--color-gray-3)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: r.swatch,
                    borderRadius: RADIUS.xs,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
