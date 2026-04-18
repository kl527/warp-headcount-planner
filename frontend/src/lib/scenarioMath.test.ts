import { describe, expect, it } from 'vitest';
import {
  computeSeries,
  deriveMetrics,
  HORIZON_MONTHS,
} from './scenarioMath';

describe('computeSeries', () => {
  it('depletes cash without revenue', () => {
    const result = computeSeries({
      startingCash: 120_000,
      baselineBurn: 10_000,
      baseMrr: 0,
      momGrowthPct: 0,
      roles: [],
    });
    expect(result.balances.length).toBe(HORIZON_MONTHS);
    expect(result.endOfMonthBalances[11]).toBe(0);
    expect(result.runwayMonths).toBe(12);
  });

  it('returns null runway when cash-flow positive', () => {
    const result = computeSeries({
      startingCash: 100_000,
      baselineBurn: 1_000,
      baseMrr: 10_000,
      momGrowthPct: 0,
      roles: [],
    });
    expect(result.runwayMonths).toBeNull();
  });
});

describe('deriveMetrics', () => {
  it('summarizes a scenario with one hire', () => {
    const metrics = deriveMetrics({
      state: {
        financials: {
          companyBalance: 500_000,
          mrr: 0,
          momGrowthPct: 0,
        },
        expenseValues: {
          rent: 5_000,
          ads: 5_000,
          tools: 0,
          custom: [],
        },
        assignments: {
          0: [
            { id: 'a1', roleKey: 'engineer', label: 'Eng', team: 'Engineering' },
          ],
        },
        roleSalaryOverrides: { engineer: 120_000 }, // $10k/mo
      },
      families: null,
      locationMultiplier: 1,
    });
    // baseline 10k + role 10k = 20k/mo → 500k runway = 25 months
    expect(metrics.peakMonthlyBurn).toBeCloseTo(20_000, 5);
    expect(metrics.totalHires).toBe(1);
    expect(metrics.runwayMonths).toBeCloseTo(25, 1);
  });
});
