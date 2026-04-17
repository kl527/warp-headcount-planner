import { FONT_FAMILIES, SHADOWS } from '../../constants/design';

export type View = 'year' | 'month';

interface ViewToggleProps {
  value: View;
  onChange: (v: View) => void;
}

const OPTIONS: { value: View; label: string }[] = [
  { value: 'year', label: 'Yearly' },
  { value: 'month', label: 'Monthly' },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const activeIndex = OPTIONS.findIndex((o) => o.value === value);

  return (
    <div
      role="tablist"
      aria-label="View"
      className="relative"
      style={{
        padding: 3,
        background: 'var(--color-gray-2)',
        borderRadius: 14,
        display: 'grid',
        gridAutoColumns: '1fr',
        gridAutoFlow: 'column',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 3,
          bottom: 3,
          left: 3,
          width: 'calc(50% - 3px)',
          background: 'var(--color-card)',
          borderRadius: 11,
          boxShadow: SHADOWS.border,
          transform: `translateX(${activeIndex * 100}%)`,
          transition: 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
        }}
      />
      {OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className="relative cursor-pointer inline-flex items-center justify-center"
            style={{
              zIndex: 1,
              height: 26,
              minWidth: 78,
              padding: '0 14px',
              fontFamily: FONT_FAMILIES.brand,
              fontSize: 13,
              lineHeight: '26px',
              fontWeight: 500,
              color: active ? 'var(--color-gray-12)' : 'var(--color-gray-10)',
              background: 'transparent',
              border: 'none',
              transition: 'color 200ms ease',
              outline: 'none',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
