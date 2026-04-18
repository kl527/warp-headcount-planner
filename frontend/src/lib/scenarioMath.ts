import type { RoleFamily } from './salaryApi';
import type { ShareableState } from './shareState';

export const HORIZON_YEARS = 4;
export const HORIZON_MONTHS = HORIZON_YEARS * 12;

export type PlacedRole = { startMonth: number; annualUsd: number };

export interface SeriesInput {
  startingCash: number;
  baselineBurn: number;
  baseMrr: number;
  momGrowthPct: number;
  roles: PlacedRole[];
}

export interface SeriesResult {
  balances: number[]; // length HORIZON_MONTHS, cash at start of each month
  endOfMonthBalances: number[]; // length HORIZON_MONTHS, cash at end of each month
  roleBurnByMonth: number[]; // length HORIZON_MONTHS
  monthlyRevenue: number[]; // length HORIZON_MONTHS
  runwayMonths: number | null; // null = never goes to zero within horizon
}

function maxP50(family: RoleFamily): number {
  let max = 0;
  for (const band of Object.values(family.levels)) {
    if (band && band.p50 > max) max = band.p50;
  }
  return max;
}

export function annualForRoleKey(
  roleKey: string,
  families: RoleFamily[] | null,
  multiplier: number,
  overrides: Record<string, number>,
): number {
  const override = overrides[roleKey];
  if (override !== undefined) return override;
  if (!families) return 0;
  const family = families.find((f) => f.key === roleKey);
  return family ? Math.round(maxP50(family) * multiplier) : 0;
}

export function computeSeries(input: SeriesInput): SeriesResult {
  const series: number[] = [];
  let cash = input.startingCash;
  series.push(cash);
  const growth = 1 + input.momGrowthPct / 100;
  const roleBurnByMonth: number[] = [];
  const monthlyRevenue: number[] = [];
  for (let m = 0; m < HORIZON_MONTHS; m++) {
    const revenue = input.baseMrr * Math.pow(growth, m);
    let roleBurn = 0;
    for (const r of input.roles) {
      if (r.startMonth <= m) roleBurn += r.annualUsd / 12;
    }
    roleBurnByMonth.push(roleBurn);
    monthlyRevenue.push(revenue);
    cash = cash - input.baselineBurn - roleBurn + revenue;
    series.push(cash);
  }

  let runwayMonths: number | null = null;
  if (series[0] <= 0) {
    runwayMonths = 0;
  } else {
    for (let m = 1; m < series.length; m++) {
      if (series[m] <= 0) {
        const prev = series[m - 1];
        const curr = series[m];
        runwayMonths = m - 1 + prev / (prev - curr);
        break;
      }
    }
  }

  return {
    balances: series.slice(0, HORIZON_MONTHS),
    endOfMonthBalances: series.slice(1, HORIZON_MONTHS + 1),
    roleBurnByMonth,
    monthlyRevenue,
    runwayMonths,
  };
}

export function baselineBurnFromExpenses(
  expenseValues: ShareableState['expenseValues'],
): number {
  return (
    expenseValues.rent +
    expenseValues.ads +
    expenseValues.tools +
    expenseValues.custom.reduce((sum, c) => sum + c.value, 0)
  );
}

export function placedRolesFromAssignments(
  assignments: ShareableState['assignments'],
  families: RoleFamily[] | null,
  locationMultiplier: number,
  overrides: Record<string, number>,
): PlacedRole[] {
  const placed: PlacedRole[] = [];
  for (const [monthStr, list] of Object.entries(assignments)) {
    const startMonth = Number(monthStr);
    for (const a of list) {
      placed.push({
        startMonth,
        annualUsd: annualForRoleKey(
          a.roleKey,
          families,
          locationMultiplier,
          overrides,
        ),
      });
    }
  }
  return placed;
}

export interface DerivedMetrics {
  runwayMonths: number | null;
  balances: number[];
  endingCash: number;
  peakMonthlyBurn: number;
  totalHires: number;
}

export function deriveMetrics(args: {
  state: Pick<
    ShareableState,
    'financials' | 'expenseValues' | 'assignments' | 'roleSalaryOverrides'
  >;
  families: RoleFamily[] | null;
  locationMultiplier: number;
}): DerivedMetrics {
  const { state, families, locationMultiplier } = args;
  const baselineBurn = baselineBurnFromExpenses(state.expenseValues);
  const roles = placedRolesFromAssignments(
    state.assignments,
    families,
    locationMultiplier,
    state.roleSalaryOverrides,
  );
  const series = computeSeries({
    startingCash: state.financials.companyBalance,
    baselineBurn,
    baseMrr: state.financials.mrr,
    momGrowthPct: state.financials.momGrowthPct,
    roles,
  });

  let peakMonthlyBurn = 0;
  for (let m = 0; m < HORIZON_MONTHS; m++) {
    const burn = baselineBurn + (series.roleBurnByMonth[m] ?? 0);
    if (burn > peakMonthlyBurn) peakMonthlyBurn = burn;
  }

  let totalHires = 0;
  for (const list of Object.values(state.assignments)) {
    totalHires += list.length;
  }

  return {
    runwayMonths: series.runwayMonths,
    balances: series.balances,
    endingCash: series.endOfMonthBalances[HORIZON_MONTHS - 1] ?? 0,
    peakMonthlyBurn,
    totalHires,
  };
}
