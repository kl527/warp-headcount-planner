import { BRAND_CTA, RADIUS, SHADOWS } from '../../constants/design';

export type View = 'year' | 'month';

interface ViewToggleProps {
  value: View;
  onChange: (v: View) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="View"
      className="inline-flex items-center p-[3px]"
      style={{
        background: 'var(--color-gray-2)',
        borderRadius: RADIUS.lg,
        boxShadow: SHADOWS.borderInset,
      }}
    >
      <Segment
        active={value === 'year'}
        onClick={() => onChange('year')}
        label="Yearly"
      />
      <Segment
        active={value === 'month'}
        onClick={() => onChange('month')}
        label="Monthly"
      />
    </div>
  );
}

function Segment({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="inline-flex items-center justify-center transition-colors cursor-pointer"
      style={{
        height: 28,
        padding: '0 14px',
        borderRadius: 6,
        background: active ? BRAND_CTA.bg : 'transparent',
        color: active ? BRAND_CTA.fg : 'var(--color-gray-11)',
        fontSize: 14,
        lineHeight: '20px',
        fontWeight: 450,
      }}
    >
      {label}
    </button>
  );
}
