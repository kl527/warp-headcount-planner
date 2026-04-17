import { CHIP, RADIUS } from '../../constants/design';
import { STATUS_COLOR, type HireStatus } from '../../data/headcount';

export function StatusBadge({ status }: { status: HireStatus }) {
  const c = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap"
      style={{
        background: c.bg,
        color: c.fg,
        padding: '2px 10px',
        borderRadius: RADIUS.lg,
        fontSize: CHIP.textSize,
        lineHeight: `${CHIP.lineHeight}px`,
        fontWeight: CHIP.weight,
      }}
    >
      {c.label}
    </span>
  );
}
