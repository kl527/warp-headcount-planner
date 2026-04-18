import {
  Briefcase,
  Code2,
  Compass,
  LineChart,
  PenTool,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Team as SalaryTeam } from '../lib/salaryApi';
import { ACCENT_SCALE, AMBER_SCALE, GRAY_SCALE, RED_SCALE } from './design';

export const TEAM_ICON_BG: Record<SalaryTeam, string> = {
  Engineering: ACCENT_SCALE[6],
  Product: GRAY_SCALE[7],
  Design: AMBER_SCALE[6],
  Data: ACCENT_SCALE[4],
  GTM: RED_SCALE[6],
  Ops: GRAY_SCALE[5],
};

export const TEAM_PILL_BG: Record<SalaryTeam, string> = {
  Engineering: ACCENT_SCALE[3],
  Product: GRAY_SCALE[3],
  Design: AMBER_SCALE[3],
  Data: ACCENT_SCALE[2],
  GTM: RED_SCALE[3],
  Ops: GRAY_SCALE[3],
};

export const TEAM_PILL_FG: Record<SalaryTeam, string> = {
  Engineering: ACCENT_SCALE[11],
  Product: GRAY_SCALE[12],
  Design: AMBER_SCALE[11],
  Data: ACCENT_SCALE[12],
  GTM: RED_SCALE[11],
  Ops: GRAY_SCALE[11],
};

export const TEAM_PILL_DOT: Record<SalaryTeam, string> = {
  Engineering: ACCENT_SCALE[9],
  Product: GRAY_SCALE[10],
  Design: AMBER_SCALE[9],
  Data: ACCENT_SCALE[10],
  GTM: RED_SCALE[9],
  Ops: GRAY_SCALE[9],
};

export const TEAM_ORDER: SalaryTeam[] = [
  'Engineering',
  'Product',
  'Design',
  'GTM',
  'Ops',
];

export const TEAM_ICON: Record<SalaryTeam, LucideIcon> = {
  Engineering: Code2,
  Product: Compass,
  Design: PenTool,
  Data: LineChart,
  GTM: Briefcase,
  Ops: Users,
};

export const TEAM_LEAD_ROLE: Record<SalaryTeam, string> = {
  Engineering: 'software-engineer',
  Product: 'product-manager',
  Design: 'product-designer',
  Data: 'data-scientist',
  GTM: 'account-executive',
  Ops: 'recruiter',
};

export const TEAM_FEATURED_ROLES: Record<SalaryTeam, Set<string>> = {
  Engineering: new Set([
    'software-engineer',
    'ml-engineer',
    'engineering-manager',
  ]),
  Product: new Set(['product-manager', 'group-product-manager']),
  Design: new Set(['product-designer', 'design-manager']),
  Data: new Set(['data-scientist', 'data-analyst', 'analytics-engineer']),
  GTM: new Set(['account-executive', 'sdr', 'customer-success-manager']),
  Ops: new Set(['recruiter', 'finance-ops', 'chief-of-staff']),
};

export const ROLE_SHORT_LABEL: Record<string, string> = {
  'software-engineer': 'SWE',
  'ml-engineer': 'ML Eng.',
  'engineering-manager': 'Eng. Manager',
  'product-manager': 'PM',
  'group-product-manager': 'Group PM',
  'product-designer': 'Designer',
  'design-manager': 'Design Manager',
  'data-scientist': 'Data Scientist',
  'data-analyst': 'Data Analyst',
  'analytics-engineer': 'Analytics Eng.',
  'account-executive': 'Account Exec',
  sdr: 'Sales Dev.',
  'customer-success-manager': 'CS Manager',
  recruiter: 'Recruiter',
  'finance-ops': 'Finance Ops',
  'chief-of-staff': 'Chief of Staff',
};
