import { FONT_FAMILIES } from '../../constants/design';

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
        padding: '14px 18px',
        minHeight: 84,
      }}
    >
      <div
        style={{
          fontSize: 11,
          lineHeight: '16px',
          color: 'var(--color-gray-10)',
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-[8px] mt-[8px]">
        <span
          style={{
            fontFamily: FONT_FAMILIES.brand,
            fontSize: 26,
            lineHeight: '32px',
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
              fontSize: 12,
              lineHeight: '16px',
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
