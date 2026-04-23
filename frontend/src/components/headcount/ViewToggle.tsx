import { FONT_FAMILIES, SHADOWS } from '../../constants/design';

export type View = 'year' | 'month' | 'runway';

interface ViewToggleProps {
  value: View;
  onChange: (v: View) => void;
}

const PERIOD_OPTIONS: { value: Exclude<View, 'runway'>; label: string }[] = [
  { value: 'year', label: 'Yearly' },
  { value: 'month', label: 'Monthly' },
];

const TRACK_RADIUS = 14;
const PILL_RADIUS = 11;
const TRACK_PADDING = 3;
const ITEM_HEIGHT = 26;
const ITEM_MIN_WIDTH = 78;
const SLIDE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

const labelStyle = (active: boolean): React.CSSProperties => ({
  zIndex: 1,
  height: ITEM_HEIGHT,
  minWidth: ITEM_MIN_WIDTH,
  padding: '0 14px',
  fontFamily: FONT_FAMILIES.brand,
  fontSize: 13,
  lineHeight: `${ITEM_HEIGHT}px`,
  fontWeight: 500,
  color: active ? 'var(--color-gray-12)' : 'var(--color-gray-10)',
  background: 'transparent',
  border: 'none',
  transition: 'color 200ms ease',
  outline: 'none',
});

const trackStyle: React.CSSProperties = {
  padding: TRACK_PADDING,
  background: 'var(--color-gray-2)',
  borderRadius: TRACK_RADIUS,
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const periodIndex = PERIOD_OPTIONS.findIndex((o) => o.value === value);
  const periodActive = periodIndex >= 0;
  const periodPct = 100 / PERIOD_OPTIONS.length;
  const runwayActive = value === 'runway';

  return (
    <div className="flex items-center gap-[8px]">
      <div
        role="tablist"
        aria-label="Time period"
        className="relative"
        style={{
          ...trackStyle,
          display: 'grid',
          gridAutoColumns: '1fr',
          gridAutoFlow: 'column',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: TRACK_PADDING,
            bottom: TRACK_PADDING,
            left: TRACK_PADDING,
            width: `calc(${periodPct}% - 2px)`,
            background: 'var(--color-card)',
            borderRadius: PILL_RADIUS,
            boxShadow: SHADOWS.border,
            transform: `translateX(${Math.max(0, periodIndex) * 100}%)`,
            opacity: periodActive ? 1 : 0,
            transition: `transform 260ms ${SLIDE_EASE}, opacity 200ms ease`,
            willChange: 'transform, opacity',
          }}
        />
        {PERIOD_OPTIONS.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(o.value)}
              className="relative cursor-pointer inline-flex items-center justify-center"
              style={labelStyle(active)}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <div
        role="tablist"
        aria-label="Runway view"
        className="relative"
        style={trackStyle}
      >
        <button
          role="tab"
          aria-selected={runwayActive}
          onClick={() => onChange('runway')}
          className="relative cursor-pointer inline-flex items-center justify-center"
          style={{
            ...labelStyle(runwayActive),
            background: runwayActive ? 'var(--color-card)' : 'transparent',
            borderRadius: PILL_RADIUS,
            boxShadow: runwayActive ? SHADOWS.border : 'none',
            transition:
              'color 200ms ease, background 200ms ease, box-shadow 200ms ease',
          }}
        >
          Runway
        </button>
      </div>
    </div>
  );
}
