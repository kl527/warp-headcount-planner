import {
  Briefcase,
  Code2,
  Compass,
  LineChart,
  PenTool,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { FONT_FAMILIES, RADIUS, SHADOWS } from '../../constants/design';
import { TEAM_COLOR, type Hire, type Team } from '../../data/headcount';
import {
  findFamilyByTitle,
  getSalaryRange,
  useSalaryCatalog,
  type LocationKey,
  type SalaryCatalog,
} from '../../lib/salaryApi';

// HIRES fixtures don't carry a location, so treat them as the Tier-1 baseline.
const DEFAULT_LOCATION: LocationKey = 'SF';

const TEAM_ICON: Record<Team, LucideIcon> = {
  Engineering: Code2,
  Product: Compass,
  Design: PenTool,
  Data: LineChart,
  GTM: Briefcase,
  Ops: Users,
};

const TEAM_ORDER: Team[] = [
  'Engineering',
  'Product',
  'Design',
  'Data',
  'GTM',
  'Ops',
];

function fmtCurrencyCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function resolveSalaryLabel(
  hire: Hire,
  catalog: SalaryCatalog | null,
): string {
  if (catalog) {
    const family = findFamilyByTitle(catalog, hire.role);
    if (family) {
      const result = getSalaryRange(
        catalog,
        family.key,
        hire.level,
        DEFAULT_LOCATION,
      );
      if (result) {
        const suffix = result.compType === 'ote' ? ' OTE' : '/yr';
        return `${fmtCurrencyCompact(result.range.p50)}${suffix}`;
      }
    }
  }
  return `${fmtCurrencyCompact(hire.estCostUsd)}/yr`;
}

type Group = { team: Team; hires: Hire[] };

function groupByTeam(hires: Hire[]): Group[] {
  const bucket = new Map<Team, Hire[]>();
  for (const h of hires) {
    const arr = bucket.get(h.team) ?? [];
    arr.push(h);
    bucket.set(h.team, arr);
  }
  return TEAM_ORDER.filter((t) => bucket.has(t)).map((team) => ({
    team,
    hires: bucket
      .get(team)!
      .slice()
      .sort((a, b) => a.startMonth.localeCompare(b.startMonth)),
  }));
}

export function HireSidebar({ hires }: { hires: Hire[] }) {
  const state = useSalaryCatalog();
  const catalog = state.status === 'ready' ? state.catalog : null;
  const groups = groupByTeam(hires);

  const topOffset = 52;

  return (
    <aside
      className="hidden laptop:flex flex-col gap-[16px] shrink-0 [&::-webkit-scrollbar]:hidden"
      style={{
        width: 220,
        position: 'sticky',
        top: topOffset,
        alignSelf: 'flex-start',
        maxHeight: `calc(100svh - ${topOffset}px - 32px)`,
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {groups.map((group) => (
        <TeamGroup key={group.team} group={group} catalog={catalog} />
      ))}
    </aside>
  );
}

function TeamGroup({
  group,
  catalog,
}: {
  group: Group;
  catalog: SalaryCatalog | null;
}) {
  const tone = TEAM_COLOR[group.team];
  return (
    <section className="flex flex-col gap-[6px]">
      <header
        className="flex items-center gap-[6px]"
        style={{
          padding: '0 4px 2px',
          fontSize: 11,
          lineHeight: '16px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: tone.fg,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: tone.dot,
          }}
        />
        <span style={{ flex: 1 }}>{group.team}</span>
        <span
          style={{
            fontFamily: FONT_FAMILIES.mono,
            fontWeight: 500,
            letterSpacing: '0.02em',
            color: 'var(--color-gray-10)',
          }}
        >
          {group.hires.length}
        </span>
      </header>
      <div className="flex flex-col gap-[6px]">
        {group.hires.map((h) => (
          <HireCard
            key={h.id}
            hire={h}
            salaryLabel={resolveSalaryLabel(h, catalog)}
          />
        ))}
      </div>
    </section>
  );
}

function HireCard({ hire, salaryLabel }: { hire: Hire; salaryLabel: string }) {
  const tone = TEAM_COLOR[hire.team];
  const Icon = TEAM_ICON[hire.team];

  return (
    <div
      className="flex items-center gap-[10px]"
      style={{
        padding: '9px 10px',
        borderRadius: RADIUS.lg,
        boxShadow: SHADOWS.border,
        background: tone.bg,
      }}
    >
      <span
        aria-hidden
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: 24,
          height: 24,
          borderRadius: RADIUS.md,
          background: 'rgba(255,255,255,0.7)',
          color: tone.fg,
          boxShadow: SHADOWS.border,
        }}
      >
        <Icon size={13} strokeWidth={2} />
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className="truncate"
          style={{
            fontSize: 13,
            lineHeight: '18px',
            fontWeight: 500,
            color: 'var(--color-gray-12)',
          }}
        >
          {hire.role}
        </span>
        <span
          className="truncate"
          style={{
            fontFamily: FONT_FAMILIES.mono,
            fontSize: 11,
            lineHeight: '15px',
            color: 'var(--color-gray-11)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em',
          }}
        >
          {salaryLabel}
        </span>
      </div>
    </div>
  );
}
