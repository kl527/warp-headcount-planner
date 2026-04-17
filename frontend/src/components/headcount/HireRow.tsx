import { FONT_FAMILIES } from '../../constants/design';
import type { Hire } from '../../data/headcount';
import { StatusBadge } from './StatusBadge';
import { TeamChip } from './TeamChip';

export function HireRow({ hire }: { hire: Hire }) {
  return (
    <div
      className="grid items-center gap-[16px] py-[14px]"
      style={{
        gridTemplateColumns: '1fr auto auto auto',
        boxShadow: 'inset 0 -1px 0 #00000014',
      }}
    >
      <div className="flex flex-col min-w-0">
        <span
          style={{
            fontSize: 15,
            lineHeight: '22px',
            fontWeight: 500,
            color: 'var(--color-gray-12)',
          }}
          className="truncate"
        >
          {hire.role}
        </span>
        <span
          style={{
            fontSize: 12,
            lineHeight: '16px',
            color: 'var(--color-gray-10)',
            fontFamily: FONT_FAMILIES.mono,
            letterSpacing: '0.02em',
          }}
        >
          {hire.level} · {hire.id.toUpperCase()}
        </span>
      </div>
      <TeamChip team={hire.team} size="sm" />
      <span
        style={{
          fontFamily: FONT_FAMILIES.mono,
          fontSize: 13,
          lineHeight: '18px',
          color: 'var(--color-gray-11)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {hire.startMonth}
      </span>
      <StatusBadge status={hire.status} />
    </div>
  );
}
