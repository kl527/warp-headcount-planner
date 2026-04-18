import {
  AppWindow,
  Briefcase,
  ChevronDown,
  Code2,
  Compass,
  Home,
  LineChart,
  Megaphone,
  PenTool,
  Plus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import {
  ACCENT_SCALE,
  AMBER_SCALE,
  FONT_FAMILIES,
  GRAY_SCALE,
  RADIUS,
  RED_SCALE,
} from '../../constants/design';
import {
  useSalaryCatalog,
  type RoleFamily,
  type Team as SalaryTeam,
} from '../../lib/salaryApi';

const SECTION_BLACK = '#000';

type ExpenseItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  iconBg: string;
};

const EXPENSE_ITEMS: ExpenseItem[] = [
  {
    id: 'rent',
    label: 'office / rent',
    icon: Home,
    value: '5,000',
    iconBg: AMBER_SCALE[5],
  },
  {
    id: 'ads',
    label: 'ad spend',
    icon: Megaphone,
    value: '5,000',
    iconBg: RED_SCALE[5],
  },
  {
    id: 'tools',
    label: 'software & tools',
    icon: AppWindow,
    value: '5,000',
    iconBg: ACCENT_SCALE[5],
  },
  {
    id: 'input',
    label: 'input',
    icon: Plus,
    value: '0',
    iconBg: GRAY_SCALE[6],
  },
];

const TEAM_ICON_BG: Record<SalaryTeam, string> = {
  Engineering: ACCENT_SCALE[6],
  Product: GRAY_SCALE[7],
  Design: AMBER_SCALE[6],
  Data: ACCENT_SCALE[4],
  GTM: RED_SCALE[6],
  Ops: GRAY_SCALE[5],
};

const TEAM_ORDER: SalaryTeam[] = [
  'Engineering',
  'Product',
  'Design',
  'GTM',
  'Ops',
];

const TEAM_ICON: Record<SalaryTeam, LucideIcon> = {
  Engineering: Code2,
  Product: Compass,
  Design: PenTool,
  Data: LineChart,
  GTM: Briefcase,
  Ops: Users,
};

// The "face" role for each team — the most indicative one, shown on top
// of the collapsed stack regardless of pay. Anything not listed falls
// back to descending max-p50 ordering.
const TEAM_LEAD_ROLE: Record<SalaryTeam, string> = {
  Engineering: 'software-engineer',
  Product: 'product-manager',
  Design: 'product-designer',
  Data: 'data-scientist',
  GTM: 'account-executive',
  Ops: 'recruiter',
};

function maxP50(family: RoleFamily): number {
  let max = 0;
  for (const band of Object.values(family.levels)) {
    if (band && band.p50 > max) max = band.p50;
  }
  return max;
}

function monthlyValue(annual: number): string {
  return Math.round(annual / 12).toLocaleString();
}

type TeamGroup = { team: SalaryTeam; items: ExpenseItem[] };

function familiesToTeamGroups(families: RoleFamily[]): TeamGroup[] {
  const byTeam = new Map<SalaryTeam, RoleFamily[]>();
  for (const f of families) {
    const arr = byTeam.get(f.team) ?? [];
    arr.push(f);
    byTeam.set(f.team, arr);
  }
  return TEAM_ORDER.filter((t) => byTeam.has(t)).map((team) => {
    const leadKey = TEAM_LEAD_ROLE[team];
    const sorted = byTeam
      .get(team)!
      .slice()
      .sort((a, b) => {
        if (a.key === leadKey) return -1;
        if (b.key === leadKey) return 1;
        return maxP50(b) - maxP50(a);
      });
    return {
      team,
      items: sorted.map((f) => ({
        id: f.key,
        label: f.displayName,
        icon: TEAM_ICON[team],
        value: monthlyValue(maxP50(f)),
        iconBg: TEAM_ICON_BG[team],
      })),
    };
  });
}

// Stacked-card layout, following the maon-expo home-page pattern:
// absolute-positioned cards with a small "peek" per card behind the top,
// max 3 visible in the collapsed state, a subtle scale falloff, tap to
// spread into natural spacing.
const CARD_HEIGHT = 51;
const STACK_PEEK = 10;
const STACK_GAP = 7;
const MAX_VISIBLE_STACK = 3;

function StackedTeamGroup({ items }: { items: ExpenseItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const total = items.length;
  const visibleInStack = Math.min(MAX_VISIBLE_STACK, total);
  const collapsedH =
    CARD_HEIGHT + STACK_PEEK * Math.max(0, visibleInStack - 1);
  const expandedH =
    total * CARD_HEIGHT + Math.max(0, total - 1) * STACK_GAP;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded((v) => !v)}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setExpanded(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
      style={{
        position: 'relative',
        height: expanded ? expandedH : collapsedH,
        transition: 'height 300ms ease',
        cursor: 'pointer',
      }}
    >
      {items.map((item, i) => {
        const clampedPos = Math.min(i, MAX_VISIBLE_STACK - 1);
        const collapsedTop = clampedPos * STACK_PEEK;
        const expandedTop = i * (CARD_HEIGHT + STACK_GAP);
        const top = expanded ? expandedTop : collapsedTop;
        const scale = expanded ? 1 : 1 - clampedPos * 0.02;
        const hiddenInStack = !expanded && i >= MAX_VISIBLE_STACK;
        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              zIndex: total - i,
              opacity: hiddenInStack ? 0 : 1,
              transition:
                'top 300ms ease, transform 300ms ease, opacity 200ms ease',
              pointerEvents: hiddenInStack ? 'none' : 'auto',
            }}
          >
            <ExpenseRow item={item} />
          </div>
        );
      })}
    </div>
  );
}

function ExpenseRow({ item }: { item: ExpenseItem }) {
  const Icon = item.icon;
  return (
    <div
      className="flex items-center"
      style={{
        width: '100%',
        height: 51,
        background: '#fff',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        padding: '10px',
        gap: 11,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 31,
          height: 31,
          borderRadius: '50%',
          background: item.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#fff',
        }}
      >
        <Icon size={14} />
      </div>
      <span
        className="flex-1 truncate"
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 12,
          color: '#000',
        }}
      >
        {item.label}
      </span>
      <div
        className="flex items-center"
        style={{
          width: 93,
          height: 32,
          background: '#f9f9f9',
          border: '0.5px solid #f9f9f9',
          borderRadius: RADIUS.lg,
          padding: '0 10px',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 12,
            color: '#aeaeae',
          }}
        >
          $
        </span>
        <input
          type="text"
          defaultValue={item.value}
          aria-label={`${item.label} cost`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: FONT_FAMILIES.mono,
            fontSize: 12,
            fontWeight: 500,
            color: '#1e1e1e',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  collapsed,
  onToggle,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontFamily: FONT_FAMILIES.sans,
        fontSize: 15,
        fontWeight: 500,
        color: SECTION_BLACK,
      }}
    >
      <span>{title}</span>
      <ChevronDown
        size={14}
        style={{
          transition: 'transform 150ms ease',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
        }}
      />
    </button>
  );
}

export function ExpensesSidebar() {
  const state = useSalaryCatalog();
  const teamGroups =
    state.status === 'ready'
      ? familiesToTeamGroups(state.catalog.families)
      : [];
  const [expensesCollapsed, setExpensesCollapsed] = useState(false);
  const [teamCollapsed, setTeamCollapsed] = useState(false);

  return (
    <aside
      className="flex-shrink-0"
      style={{
        width: '100%',
        maxWidth: 318,
        background: '#f9f9f9',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        padding: '19px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <SectionHeader
        title="Monthly Expenses"
        collapsed={expensesCollapsed}
        onToggle={() => setExpensesCollapsed((v) => !v)}
      />
      {!expensesCollapsed && (
        <div className="flex flex-col gap-[7px]">
          {EXPENSE_ITEMS.map((item) => (
            <ExpenseRow key={item.id} item={item} />
          ))}
        </div>
      )}
      <SectionHeader
        title="Team"
        collapsed={teamCollapsed}
        onToggle={() => setTeamCollapsed((v) => !v)}
      />
      {!teamCollapsed && (
        <div className="flex flex-col gap-[14px]">
          {teamGroups.map((g) => (
            <StackedTeamGroup key={g.team} items={g.items} />
          ))}
        </div>
      )}
    </aside>
  );
}
