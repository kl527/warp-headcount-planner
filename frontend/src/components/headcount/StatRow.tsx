import type { Hire } from '../../data/headcount';
import { StatPill } from './StatPill';

function fmtCurrencyCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function StatRow({ hires }: { hires: Hire[] }) {
  const filled = hires.filter((h) => h.status === 'filled').length;
  const accepted = hires.filter((h) => h.status === 'accepted').length;
  const open = hires.filter((h) => h.status === 'open').length;
  const planned = hires.length;
  const cost = hires.reduce((s, h) => s + h.estCostUsd, 0);

  return (
    <div className="grid grid-cols-2 tablet:grid-cols-4 gap-[16px]">
      <StatPill
        label="Planned hires"
        value={String(planned)}
        delta={{
          text: `${filled + accepted} committed`,
          tone: 'positive',
        }}
      />
      <StatPill
        label="Filled"
        value={String(filled)}
        delta={{ text: `+${accepted} accepted`, tone: 'positive' }}
      />
      <StatPill
        label="Open reqs"
        value={String(open)}
        delta={{ text: `${open} in market`, tone: 'warning' }}
      />
      <StatPill
        label="Est. annual cost"
        value={fmtCurrencyCompact(cost)}
        delta={{ text: `${planned} roles`, tone: 'neutral' }}
        accent
      />
    </div>
  );
}
