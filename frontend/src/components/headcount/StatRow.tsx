import {
  Calendar,
  DollarSign,
  FileText,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { FONT_FAMILIES, RADIUS, SHADOWS } from '../../constants/design';
import type { Hire } from '../../data/headcount';

function fmtCurrencyCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function StatRow({ hires }: { hires: Hire[] }) {
  const cost = hires.reduce((s, h) => s + h.estCostUsd, 0);

  return (
    <div
      className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-4 gap-px overflow-hidden"
      style={{
        background: 'oklch(0 0 0 / 0.08)',
        borderRadius: RADIUS.xl,
        boxShadow: SHADOWS.borderMedium,
      }}
    >
      <StatCell
        icon={DollarSign}
        label="Est. annual cost"
        value={fmtCurrencyCompact(cost)}
      />
      <StatCell icon={Users} label="Placeholder" value="—" />
      <StatCell icon={FileText} label="Placeholder" value="—" />
      <StatCell icon={Calendar} label="Placeholder" value="—" />
    </div>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div
      className="grid items-start"
      style={{
        background: 'var(--color-card)',
        padding: '20px 24px',
        gridTemplateColumns: 'auto 1fr',
        columnGap: 10,
      }}
    >
      <Icon
        size={22}
        strokeWidth={1.9}
        style={{
          color: 'var(--color-gray-12)',
          marginTop: 0,
        }}
      />
      <div className="flex flex-col gap-[10px]">
        <div
          style={{
            fontSize: 14,
            lineHeight: '20px',
            color: 'var(--color-gray-10)',
            fontWeight: 450,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 20,
            lineHeight: '28px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--color-gray-12)',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
