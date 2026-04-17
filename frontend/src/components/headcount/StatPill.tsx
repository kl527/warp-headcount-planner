import { FONT_FAMILIES, RADIUS, SHADOWS } from '../../constants/design';

interface StatPillProps {
  label: string;
  value: string;
  delta?: { text: string; tone: 'positive' | 'neutral' | 'warning' };
  accent?: boolean;
}

export function StatPill({ label, value, delta, accent }: StatPillProps) {
  const toneColor =
    delta?.tone === 'positive'
      ? 'var(--color-accent-11)'
      : delta?.tone === 'warning'
        ? 'var(--color-amber-11)'
        : 'var(--color-gray-10)';
  return (
    <div
      className="flex flex-col justify-between"
      style={{
        background: 'var(--color-card)',
        borderRadius: RADIUS.xl,
        boxShadow: SHADOWS.border,
        padding: '18px 20px',
        minHeight: 96,
      }}
    >
      <div
        style={{
          fontSize: 13,
          lineHeight: '18px',
          color: 'var(--color-gray-10)',
          fontWeight: 450,
          letterSpacing: '0.01em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-[10px] mt-[10px]">
        <span
          style={{
            fontFamily: FONT_FAMILIES.brand,
            fontSize: 34,
            lineHeight: '40px',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: accent ? 'var(--color-accent-11)' : 'var(--color-gray-12)',
          }}
        >
          {value}
        </span>
        {delta && (
          <span
            style={{
              fontSize: 13,
              lineHeight: '18px',
              fontWeight: 500,
              color: toneColor,
            }}
          >
            {delta.text}
          </span>
        )}
      </div>
    </div>
  );
}
