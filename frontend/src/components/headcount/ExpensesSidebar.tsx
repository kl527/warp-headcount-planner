import { AppWindow, Code2, Home, Megaphone, Plus } from 'lucide-react';
import type { ComponentType } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';

const ICON_BG = 'rgba(226, 18, 0, 0.35)';
const SECTION_RED = '#e21200';

type ExpenseItem = {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  value: string;
};

const EXPENSE_ITEMS: ExpenseItem[] = [
  { id: 'rent', label: 'office / rent', icon: Home, value: '5,000' },
  { id: 'ads', label: 'ad spend', icon: Megaphone, value: '5,000' },
  { id: 'tools', label: 'software & tools', icon: AppWindow, value: '5,000' },
  { id: 'input', label: 'input', icon: Plus, value: '0' },
];

const TEAM_ITEMS: ExpenseItem[] = [
  { id: 'swe', label: 'SWE', icon: Code2, value: '5,000' },
];

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
          background: ICON_BG,
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

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontFamily: FONT_FAMILIES.sans,
        fontSize: 15,
        fontWeight: 500,
        color: SECTION_RED,
      }}
    >
      {title}
    </div>
  );
}

export function ExpensesSidebar() {
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
      <SectionHeader title="Monthly Expenses" />
      <div className="flex flex-col gap-[7px]">
        {EXPENSE_ITEMS.map((item) => (
          <ExpenseRow key={item.id} item={item} />
        ))}
      </div>
      <SectionHeader title="Team" />
      <div className="flex flex-col gap-[7px]">
        {TEAM_ITEMS.map((item) => (
          <ExpenseRow key={item.id} item={item} />
        ))}
      </div>
    </aside>
  );
}
