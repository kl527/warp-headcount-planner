/**
 * Burn & runway math for a headcount scenario.
 *
 * Conventions (stable across the app):
 *
 * - `endMonth` is INCLUSIVE. A role with `startMonth: 0, endMonth: 5` is
 *   active in months 0, 1, 2, 3, 4, 5 — six months of cost.
 *
 * - `monthlyRevenue` is monthly, NOT annualized. It is subtracted once per
 *   month from the sum of salary + baseline to produce a net burn.
 *
 * - `computeMonthlyBurn` returns net OUTFLOW. A negative number means the
 *   business was profitable that month; the cash series still correctly
 *   grows cash in that case (cash[m+1] = cash[m] - burn).
 *
 * - Runway uses LINEAR INTERPOLATION between the two bracketing integer
 *   months. If cash[m] >= 0 and cash[m+1] < 0, runway = m + cash[m] / burn[m].
 *   Returns null if cash never crosses zero within the horizon.
 *
 * - The cash series has length `horizonMonths + 1`. `series[m].cash` is the
 *   cash balance at the START of month m (before that month's burn hits).
 *   `series[0].cash` equals `startingCash`.
 */

import type { Role, Scenario } from "../types/scenario";

export function monthlyCostForRole(role: Role): number {
  return (role.baseSalary * role.benefitsMultiplier) / 12;
}

export function isRoleActiveInMonth(role: Role, month: number): boolean {
  if (month < role.startMonth) return false;
  if (role.endMonth !== undefined && month > role.endMonth) return false;
  return true;
}

export function computeMonthlyBurn(scenario: Scenario, month: number): number {
  let salaryCost = 0;
  for (const role of scenario.roles) {
    if (isRoleActiveInMonth(role, month)) {
      salaryCost += monthlyCostForRole(role);
    }
  }
  return salaryCost + scenario.baselineBurn - scenario.monthlyRevenue;
}

export type CashPoint = { month: number; cash: number; burn: number };

export function computeCashSeries(scenario: Scenario): CashPoint[] {
  const points: CashPoint[] = [];
  let cash = scenario.startingCash;
  for (let m = 0; m <= scenario.horizonMonths; m++) {
    const burn = computeMonthlyBurn(scenario, m);
    points.push({ month: m, cash, burn });
    cash = cash - burn;
  }
  return points;
}

export function computeRunwayMonths(scenario: Scenario): number | null {
  const series = computeCashSeries(scenario);
  if (series[0].cash <= 0) return 0;
  for (let m = 1; m < series.length; m++) {
    if (series[m].cash <= 0) {
      const prev = series[m - 1].cash;
      const curr = series[m].cash;
      return m - 1 + prev / (prev - curr);
    }
  }
  return null;
}

const MS_PER_MONTH = (365.25 / 12) * 24 * 60 * 60 * 1000;

export function computeZeroCashDate(
  scenario: Scenario,
  anchorDate: Date,
): Date | null {
  const runway = computeRunwayMonths(scenario);
  if (runway === null) return null;
  return new Date(anchorDate.getTime() + runway * MS_PER_MONTH);
}
