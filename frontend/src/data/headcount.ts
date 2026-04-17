export type HireStatus = 'planned' | 'open' | 'accepted' | 'filled';
export type Team = 'Engineering' | 'Product' | 'Design' | 'GTM' | 'Ops' | 'Data';
export type Level = 'IC' | 'Senior' | 'Staff' | 'Manager';

export interface Hire {
  id: string;
  role: string;
  team: Team;
  level: Level;
  startMonth: string; // 'YYYY-MM'
  status: HireStatus;
  estCostUsd: number; // annualized
}

export const PLAN_YEAR = 2026;

/** Deterministic team → color role. Keys match ACCENT_SCALE/GRAY_SCALE/AMBER_SCALE steps. */
export const TEAM_COLOR: Record<
  Team,
  { bg: string; fg: string; dot: string }
> = {
  Engineering: {
    bg: 'var(--color-accent-3)',
    fg: 'var(--color-accent-11)',
    dot: 'var(--color-accent-10)',
  },
  Product: {
    bg: 'var(--color-gray-3)',
    fg: 'var(--color-gray-12)',
    dot: 'var(--color-gray-11)',
  },
  Design: {
    bg: 'var(--color-amber-3)',
    fg: 'var(--color-amber-11)',
    dot: 'var(--color-amber-9)',
  },
  GTM: {
    bg: 'var(--color-accent-4)',
    fg: 'var(--color-accent-12)',
    dot: 'var(--color-accent-9)',
  },
  Ops: {
    bg: 'var(--color-gray-4)',
    fg: 'var(--color-gray-11)',
    dot: 'var(--color-gray-10)',
  },
  Data: {
    bg: 'var(--color-accent-2)',
    fg: 'var(--color-accent-12)',
    dot: 'var(--color-accent-11)',
  },
};

export const STATUS_COLOR: Record<
  HireStatus,
  { bg: string; fg: string; label: string }
> = {
  filled: {
    bg: 'var(--color-gray-3)',
    fg: 'var(--color-gray-12)',
    label: 'Filled',
  },
  accepted: {
    bg: 'var(--color-accent-3)',
    fg: 'var(--color-accent-11)',
    label: 'Accepted',
  },
  open: {
    bg: 'var(--color-amber-3)',
    fg: 'var(--color-amber-11)',
    label: 'Open req',
  },
  planned: {
    bg: 'var(--color-gray-2)',
    fg: 'var(--color-gray-11)',
    label: 'Planned',
  },
};

const mk = (
  id: string,
  role: string,
  team: Team,
  level: Level,
  month: number,
  status: HireStatus,
  costUsd: number,
): Hire => ({
  id,
  role,
  team,
  level,
  startMonth: `${PLAN_YEAR}-${String(month).padStart(2, '0')}`,
  status,
  estCostUsd: costUsd,
});

export const HIRES: Hire[] = [
  // Q1
  mk('h01', 'Senior Backend Engineer', 'Engineering', 'Senior', 1, 'filled', 220_000),
  mk('h02', 'Product Designer', 'Design', 'IC', 1, 'filled', 170_000),
  mk('h03', 'Analytics Engineer', 'Data', 'Senior', 2, 'accepted', 195_000),
  mk('h04', 'Frontend Engineer', 'Engineering', 'IC', 2, 'open', 170_000),
  mk('h05', 'Account Executive', 'GTM', 'Senior', 2, 'open', 260_000),
  mk('h06', 'Staff Platform Engineer', 'Engineering', 'Staff', 3, 'accepted', 290_000),
  mk('h07', 'Product Manager', 'Product', 'Senior', 3, 'open', 215_000),
  mk('h08', 'Technical Recruiter', 'Ops', 'IC', 3, 'filled', 145_000),

  // Q2
  mk('h09', 'Engineering Manager', 'Engineering', 'Manager', 4, 'open', 295_000),
  mk('h10', 'Senior Data Scientist', 'Data', 'Senior', 4, 'planned', 225_000),
  mk('h11', 'Brand Designer', 'Design', 'IC', 4, 'planned', 160_000),
  mk('h12', 'Solutions Engineer', 'GTM', 'Senior', 5, 'open', 240_000),
  mk('h13', 'Backend Engineer', 'Engineering', 'IC', 5, 'planned', 175_000),
  mk('h14', 'Finance Ops Lead', 'Ops', 'Senior', 6, 'planned', 200_000),
  mk('h15', 'Product Manager', 'Product', 'IC', 6, 'planned', 180_000),

  // Q3
  mk('h16', 'Security Engineer', 'Engineering', 'Staff', 7, 'planned', 285_000),
  mk('h17', 'Design Manager', 'Design', 'Manager', 7, 'planned', 240_000),
  mk('h18', 'SDR', 'GTM', 'IC', 7, 'planned', 125_000),
  mk('h19', 'SDR', 'GTM', 'IC', 7, 'planned', 125_000),
  mk('h20', 'Machine Learning Engineer', 'Data', 'Staff', 8, 'planned', 290_000),
  mk('h21', 'Mobile Engineer', 'Engineering', 'Senior', 8, 'planned', 215_000),
  mk('h22', 'Group Product Manager', 'Product', 'Manager', 9, 'planned', 270_000),

  // Q4
  mk('h23', 'Staff Backend Engineer', 'Engineering', 'Staff', 10, 'planned', 300_000),
  mk('h24', 'Content Designer', 'Design', 'IC', 10, 'planned', 155_000),
  mk('h25', 'Revenue Operations', 'Ops', 'IC', 10, 'planned', 160_000),
  mk('h26', 'Account Executive', 'GTM', 'Senior', 11, 'planned', 260_000),
  mk('h27', 'Analytics Engineer', 'Data', 'IC', 11, 'planned', 175_000),
  mk('h28', 'Frontend Engineer', 'Engineering', 'Senior', 12, 'planned', 215_000),
  mk('h29', 'People Partner', 'Ops', 'Senior', 12, 'planned', 195_000),
  mk('h30', 'Product Manager', 'Product', 'Senior', 12, 'planned', 215_000),
];

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function monthKey(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}`;
}

export function hiresForMonth(hires: Hire[], key: string): Hire[] {
  return hires.filter((h) => h.startMonth === key);
}

export function hiresForYear(hires: Hire[], year: number): Hire[] {
  const prefix = `${year}-`;
  return hires.filter((h) => h.startMonth.startsWith(prefix));
}

export function currentMonthKey(): string {
  const d = new Date();
  return monthKey(d.getFullYear(), d.getMonth());
}
