import {
  AppWindow,
  ChevronDown,
  Home,
  Megaphone,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import {
  ACCENT_SCALE,
  AMBER_SCALE,
  FONT_FAMILIES,
  GRAY_SCALE,
  RADIUS,
  RED_SCALE,
} from '../../constants/design';
import {
  ROLE_SHORT_LABEL,
  TEAM_FEATURED_ROLES,
  TEAM_ICON,
  TEAM_ICON_BG,
  TEAM_LEAD_ROLE,
  TEAM_ORDER,
} from '../../constants/roleDisplay';
import {
  useSalaryCatalog,
  type RoleFamily,
  type Team as SalaryTeam,
} from '../../lib/salaryApi';
import { useRoleDnd, type RoleCard } from './roleDnd';

const SECTION_BLACK = '#000';

type ExpenseItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  iconBg: string;
  roleCard?: RoleCard;
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
    if (!TEAM_FEATURED_ROLES[f.team].has(f.key)) continue;
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
      items: sorted.map((f) => {
        const label = ROLE_SHORT_LABEL[f.key] ?? f.displayName;
        return {
          id: f.key,
          label,
          icon: TEAM_ICON[team],
          value: monthlyValue(maxP50(f)),
          iconBg: TEAM_ICON_BG[team],
          roleCard: { roleKey: f.key, label, team },
        };
      }),
    };
  });
}

const CARD_HEIGHT = 51;
const STACK_PEEK = 10;
const STACK_GAP = 7;
const MAX_VISIBLE_STACK = 3;

function StackedTeamGroup({
  items,
  expanded,
  onToggle,
  onSetExpanded,
}: {
  items: ExpenseItem[];
  expanded: boolean;
  onToggle: () => void;
  onSetExpanded: (next: boolean) => void;
}) {
  const total = items.length;
  const visibleInStack = Math.min(MAX_VISIBLE_STACK, total);
  const collapsedH =
    CARD_HEIGHT + STACK_PEEK * Math.max(0, visibleInStack - 1);
  const expandedH =
    total * CARD_HEIGHT + Math.max(0, total - 1) * STACK_GAP;
  const rootRef = useRef<HTMLDivElement | null>(null);

  const hasInputFocusInside = () => {
    const root = rootRef.current;
    if (!root) return false;
    const active = document.activeElement;
    return active instanceof HTMLInputElement && root.contains(active);
  };

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={onToggle}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') onSetExpanded(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return;
        if (hasInputFocusInside()) return;
        onSetExpanded(false);
      }}
      onFocus={() => onSetExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onSetExpanded(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{
        position: 'relative',
        height: expanded ? expandedH : collapsedH,
        transition: 'height 450ms ease',
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
                'top 450ms ease, transform 450ms ease, opacity 300ms ease',
              pointerEvents: hiddenInStack ? 'none' : 'auto',
            }}
          >
            <ExpenseRow item={item} draggable={expanded && !hiddenInStack} />
          </div>
        );
      })}
    </div>
  );
}

function ExpenseRow({
  item,
  draggable,
}: {
  item: ExpenseItem;
  draggable?: boolean;
}) {
  const Icon = item.icon;
  const dnd = useRoleDnd();
  const rowRef = useRef<HTMLDivElement | null>(null);
  const suppressClick = useRef(false);

  const canDrag = Boolean(draggable && item.roleCard);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDrag || !item.roleCard) return;
    // Only left mouse / primary touch.
    if (e.button !== 0) return;
    // Let the salary input handle its own pointer events.
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT') return;
    const el = rowRef.current;
    if (!el) return;
    suppressClick.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const onMoveOnce = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) >= 4) {
        suppressClick.current = true;
      }
    };
    window.addEventListener('pointermove', onMoveOnce);
    window.addEventListener(
      'pointerup',
      () => window.removeEventListener('pointermove', onMoveOnce),
      { once: true },
    );
    dnd.beginDrag(item.roleCard, { kind: 'sidebar' }, e, el);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.stopPropagation();
      e.preventDefault();
      suppressClick.current = false;
    }
  };

  return (
    <div
      ref={rowRef}
      className="flex items-center"
      onPointerDown={handlePointerDown}
      onClickCapture={handleClickCapture}
      style={{
        width: '100%',
        height: 51,
        background: '#fff',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        padding: '10px',
        gap: 11,
        cursor: canDrag ? 'grab' : undefined,
        touchAction: canDrag ? 'none' : undefined,
        userSelect: 'none',
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
          onPointerDown={(e) => e.stopPropagation()}
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
  const [activeTeam, setActiveTeam] = useState<SalaryTeam | null>(null);

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
            <StackedTeamGroup
              key={g.team}
              items={g.items}
              expanded={activeTeam === g.team}
              onToggle={() =>
                setActiveTeam((cur) => (cur === g.team ? null : g.team))
              }
              onSetExpanded={(next) =>
                setActiveTeam((cur) => {
                  if (next) return g.team;
                  return cur === g.team ? null : cur;
                })
              }
            />
          ))}
        </div>
      )}
    </aside>
  );
}
