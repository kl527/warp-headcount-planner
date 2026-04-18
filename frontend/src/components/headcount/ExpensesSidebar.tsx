import {
  AppWindow,
  ChevronDown,
  Home,
  Megaphone,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
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
  type LocationKey,
  type RoleFamily,
  type Team as SalaryTeam,
} from '../../lib/salaryApi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoneyInput } from './MoneyInput';
import { useRoleDnd, type RoleCard } from './roleDnd';
import { type View } from './ViewToggle';

const LOCATION_OPTIONS: readonly LocationKey[] = [
  'SF',
  'NYC',
  'Seattle',
  'Remote US',
  'Europe',
  'LATAM',
];

const SECTION_BLACK = '#000';

type ExpenseItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  value: number;
  iconBg: string;
  roleCard?: RoleCard;
};

export type FixedExpenseId = 'rent' | 'ads' | 'tools';

export type CustomExpense = {
  id: string;
  label: string;
  value: number;
};

export type MonthlyExpenseValues = {
  rent: number;
  ads: number;
  tools: number;
  custom: CustomExpense[];
};

const FIXED_EXPENSE_META: Array<{
  id: FixedExpenseId;
  label: string;
  icon: LucideIcon;
  iconBg: string;
}> = [
  { id: 'rent', label: 'office / rent', icon: Home, iconBg: AMBER_SCALE[5] },
  { id: 'ads', label: 'ad spend', icon: Megaphone, iconBg: RED_SCALE[5] },
  { id: 'tools', label: 'software & tools', icon: AppWindow, iconBg: ACCENT_SCALE[5] },
];

const CUSTOM_ICON_BG = GRAY_SCALE[6];

function maxP50(family: RoleFamily): number {
  let max = 0;
  for (const band of Object.values(family.levels)) {
    if (band && band.p50 > max) max = band.p50;
  }
  return max;
}

type TeamGroup = { team: SalaryTeam; items: ExpenseItem[] };

function familiesToTeamGroups(
  families: RoleFamily[],
  view: View,
  multiplier: number,
  overrides: Record<string, number>,
): TeamGroup[] {
  const byTeam = new Map<SalaryTeam, RoleFamily[]>();
  for (const f of families) {
    if (!TEAM_FEATURED_ROLES[f.team].has(f.key)) continue;
    const arr = byTeam.get(f.team) ?? [];
    arr.push(f);
    byTeam.set(f.team, arr);
  }
  return TEAM_ORDER.filter((t) => byTeam.has(t)).map((team) => {
    const leadKey = TEAM_LEAD_ROLE[team];
    const annualFor = (f: RoleFamily) =>
      overrides[f.key] ?? Math.round(maxP50(f) * multiplier);
    const sorted = byTeam
      .get(team)!
      .slice()
      .sort((a, b) => {
        if (a.key === leadKey) return -1;
        if (b.key === leadKey) return 1;
        return annualFor(b) - annualFor(a);
      });
    return {
      team,
      items: sorted.map((f) => {
        const label = ROLE_SHORT_LABEL[f.key] ?? f.displayName;
        const annual = annualFor(f);
        return {
          id: f.key,
          label,
          icon: TEAM_ICON[team],
          value: view === 'year' ? annual : Math.round(annual / 12),
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
  onItemValueChange,
}: {
  items: ExpenseItem[];
  expanded: boolean;
  onToggle: () => void;
  onSetExpanded: (next: boolean) => void;
  onItemValueChange?: (id: string, next: number) => void;
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
            <ExpenseRow
              item={item}
              draggable={expanded && !hiddenInStack}
              onValueChange={
                onItemValueChange
                  ? (next) => onItemValueChange(item.id, next)
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function ExpenseRow({
  item,
  draggable,
  onValueChange,
  onLabelChange,
  labelPlaceholder,
  valueMultiplier = 1,
}: {
  item: ExpenseItem;
  draggable?: boolean;
  onValueChange?: (next: number) => void;
  onLabelChange?: (next: string) => void;
  labelPlaceholder?: string;
  valueMultiplier?: number;
}) {
  const [localValue, setLocalValue] = useState<number>(item.value);
  const [syncedFrom, setSyncedFrom] = useState<number>(item.value);
  const isControlled = onValueChange !== undefined;
  if (!isControlled && item.value !== syncedFrom) {
    setLocalValue(item.value);
    setSyncedFrom(item.value);
  }
  const storedValue = isControlled ? item.value : localValue;
  const currentValue = storedValue * valueMultiplier;
  const handleValueChange = (next: number) => {
    const normalized =
      valueMultiplier === 1 ? next : Math.round(next / valueMultiplier);
    if (isControlled) onValueChange(normalized);
    else setLocalValue(normalized);
  };
  const Icon = item.icon;
  const dnd = useRoleDnd();
  const rowRef = useRef<HTMLDivElement | null>(null);
  const suppressClick = useRef(false);

  const canDrag = Boolean(draggable && item.roleCard);
  const labelEditable = onLabelChange !== undefined;

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
      {labelEditable ? (
        <input
          type="text"
          value={item.label}
          placeholder={labelPlaceholder}
          onChange={(e) => onLabelChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 truncate"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 12,
            color: '#000',
          }}
        />
      ) : (
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
      )}
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
        <MoneyInput
          value={currentValue}
          onChange={handleValueChange}
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

function LocationPicker({
  selected,
  onChange,
}: {
  selected: LocationKey;
  onChange: (next: LocationKey) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: FONT_FAMILIES.mono,
            fontSize: 11,
            letterSpacing: '0.02em',
            color: 'var(--color-gray-10)',
          }}
        >
          set to {selected}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" style={{ minWidth: 140 }}>
        <DropdownMenuRadioGroup
          value={selected}
          onValueChange={(v) => onChange(v as LocationKey)}
        >
          {LOCATION_OPTIONS.map((loc) => (
            <DropdownMenuRadioItem
              key={loc}
              value={loc}
              style={{ fontFamily: FONT_FAMILIES.mono, fontSize: 12 }}
            >
              {loc}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const STAGGER_MS = 30;
const ITEM_DURATION_MS = 160;
const CONTAINER_DURATION_MS = 260;
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

function StaggeredCollapse({
  collapsed,
  gap,
  children,
}: {
  collapsed: boolean;
  gap: number;
  children: ReactNode;
}) {
  const items = Children.toArray(children);
  const count = items.length;
  const [mounted, setMounted] = useState(!collapsed);
  const [visible, setVisible] = useState(!collapsed);

  useEffect(() => {
    if (collapsed) {
      setVisible(false);
      const t = window.setTimeout(
        () => setMounted(false),
        CONTAINER_DURATION_MS + 20,
      );
      return () => window.clearTimeout(t);
    }
    setMounted(true);
    const raf = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(raf);
  }, [collapsed]);

  if (!mounted) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: visible ? '1fr' : '0fr',
        transition: `grid-template-rows ${CONTAINER_DURATION_MS}ms ${EASE_OUT}`,
      }}
    >
      <div style={{ overflow: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          {items.map((child, i) => {
            const collapseDelay = (count - 1 - i) * STAGGER_MS;
            const expandDelay = i * STAGGER_MS;
            const delay = visible ? expandDelay : collapseDelay;
            return (
              <div
                key={i}
                style={{
                  transform: visible ? 'translateY(0)' : 'translateY(-14px)',
                  opacity: visible ? 1 : 0,
                  transition: `transform ${ITEM_DURATION_MS}ms ${EASE_OUT} ${delay}ms, opacity ${ITEM_DURATION_MS}ms ${EASE_OUT} ${delay}ms`,
                  willChange: 'transform, opacity',
                }}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const CUSTOM_ROW_GAP = 7;
const CUSTOM_ENTER_MS = 280;

function AnimatedCustomRow({
  initial,
  gapTop,
  children,
}: {
  initial: boolean;
  gapTop: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(initial);

  useEffect(() => {
    if (initial) return;
    const raf = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(raf);
  }, [initial]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        paddingTop: open && gapTop ? CUSTOM_ROW_GAP : 0,
        opacity: open ? 1 : 0,
        transition: `grid-template-rows ${CUSTOM_ENTER_MS}ms ${EASE_OUT}, padding-top ${CUSTOM_ENTER_MS}ms ${EASE_OUT}, opacity ${CUSTOM_ENTER_MS}ms ${EASE_OUT}`,
      }}
    >
      <div style={{ overflow: 'hidden', minHeight: 0 }}>{children}</div>
    </div>
  );
}

function CustomExpenseList({
  custom,
  onChange,
  valueMultiplier = 1,
}: {
  custom: CustomExpense[];
  onChange: (next: CustomExpense[]) => void;
  valueMultiplier?: number;
}) {
  const [initialIds] = useState<Set<string>>(
    () => new Set(custom.map((c) => c.id)),
  );

  const ensureTrailingDraft = (list: CustomExpense[]): CustomExpense[] => {
    const last = list[list.length - 1];
    if (!last || last.label.trim() !== '' || last.value !== 0) {
      return [...list, { id: nanoid(8), label: '', value: 0 }];
    }
    return list;
  };

  const handleLabelChange = (id: string, label: string) => {
    onChange(
      ensureTrailingDraft(
        custom.map((c) => (c.id === id ? { ...c, label } : c)),
      ),
    );
  };

  const handleValueChange = (id: string, value: number) => {
    onChange(
      ensureTrailingDraft(
        custom.map((c) => (c.id === id ? { ...c, value } : c)),
      ),
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {custom.map((c, i) => {
        const isInitial = initialIds.has(c.id);
        const isLast = i === custom.length - 1;
        const item: ExpenseItem = {
          id: c.id,
          label: c.label,
          icon: Plus,
          iconBg: CUSTOM_ICON_BG,
          value: c.value,
        };
        return (
          <AnimatedCustomRow key={c.id} initial={isInitial} gapTop={i > 0}>
            <ExpenseRow
              item={item}
              onLabelChange={(next) => handleLabelChange(c.id, next)}
              onValueChange={(next) => handleValueChange(c.id, next)}
              labelPlaceholder={isLast ? 'input' : ''}
              valueMultiplier={valueMultiplier}
            />
          </AnimatedCustomRow>
        );
      })}
    </div>
  );
}

interface ExpensesSidebarProps {
  expenseValues: MonthlyExpenseValues;
  onExpenseChange: (patch: Partial<MonthlyExpenseValues>) => void;
  view: View;
  selectedLocation: LocationKey;
  onLocationChange: (next: LocationKey) => void;
  roleSalaryOverrides: Record<string, number>;
  onRoleSalaryChange: (roleKey: string, annualUsd: number) => void;
}

export function ExpensesSidebar({
  expenseValues,
  onExpenseChange,
  view,
  selectedLocation,
  onLocationChange,
  roleSalaryOverrides,
  onRoleSalaryChange,
}: ExpensesSidebarProps) {
  const state = useSalaryCatalog();
  const multiplier =
    state.status === 'ready'
      ? state.catalog.locations[selectedLocation] ?? 1
      : 1;
  const teamGroups =
    state.status === 'ready'
      ? familiesToTeamGroups(
          state.catalog.families,
          view,
          multiplier,
          roleSalaryOverrides,
        )
      : [];
  const handleRoleItemValueChange = (roleKey: string, displayed: number) => {
    const annual = view === 'year' ? displayed : displayed * 12;
    onRoleSalaryChange(roleKey, annual);
  };
  const valueMultiplier = view === 'year' ? 12 : 1;
  const [expensesCollapsed, setExpensesCollapsed] = useState(false);
  const [teamCollapsed, setTeamCollapsed] = useState(false);
  const [activeTeam, setActiveTeam] = useState<SalaryTeam | null>(null);

  const fixedExpenseItems: ExpenseItem[] = FIXED_EXPENSE_META.map((m) => ({
    id: m.id,
    label: m.label,
    icon: m.icon,
    iconBg: m.iconBg,
    value: expenseValues[m.id],
  }));

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
        title={view === 'year' ? 'Yearly Expenses' : 'Monthly Expenses'}
        collapsed={expensesCollapsed}
        onToggle={() => setExpensesCollapsed((v) => !v)}
      />
      <StaggeredCollapse collapsed={expensesCollapsed} gap={7}>
        {fixedExpenseItems.map((item) => (
          <ExpenseRow
            key={item.id}
            item={item}
            valueMultiplier={valueMultiplier}
            onValueChange={(next) =>
              onExpenseChange({
                [item.id as FixedExpenseId]: next,
              } as Partial<MonthlyExpenseValues>)
            }
          />
        ))}
        <CustomExpenseList
          custom={expenseValues.custom}
          onChange={(next) => onExpenseChange({ custom: next })}
          valueMultiplier={valueMultiplier}
        />
      </StaggeredCollapse>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <SectionHeader
          title="Team"
          collapsed={teamCollapsed}
          onToggle={() => setTeamCollapsed((v) => !v)}
        />
        <LocationPicker
          selected={selectedLocation}
          onChange={onLocationChange}
        />
      </div>
      <StaggeredCollapse collapsed={teamCollapsed} gap={14}>
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
            onItemValueChange={handleRoleItemValueChange}
          />
        ))}
      </StaggeredCollapse>
    </aside>
  );
}
