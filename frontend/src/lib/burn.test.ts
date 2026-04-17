import { describe, expect, it } from "vitest";
import {
  computeCashSeries,
  computeMonthlyBurn,
  computeRunwayMonths,
  computeZeroCashDate,
  isRoleActiveInMonth,
  monthlyCostForRole,
} from "./burn";
import type { Role, Scenario } from "../types/scenario";

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: "r1",
    title: "Software Engineer",
    department: "Engineering",
    location: "SF",
    baseSalary: 180_000,
    benefitsMultiplier: 1.3,
    startMonth: 0,
    ...overrides,
  };
}

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: "s1",
    name: "test",
    startingCash: 0,
    monthlyRevenue: 0,
    baselineBurn: 0,
    horizonMonths: 24,
    roles: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("monthlyCostForRole", () => {
  it("computes baseSalary * benefitsMultiplier / 12 exactly", () => {
    const role = makeRole({ baseSalary: 180_000, benefitsMultiplier: 1.3 });
    expect(monthlyCostForRole(role)).toBe((180_000 * 1.3) / 12);
    expect(monthlyCostForRole(role)).toBe(19_500);
  });

  it("handles multiplier of 1.0", () => {
    const role = makeRole({ baseSalary: 120_000, benefitsMultiplier: 1.0 });
    expect(monthlyCostForRole(role)).toBe(10_000);
  });
});

describe("isRoleActiveInMonth", () => {
  it("is active at exactly startMonth", () => {
    const role = makeRole({ startMonth: 3 });
    expect(isRoleActiveInMonth(role, 3)).toBe(true);
  });

  it("is inactive at startMonth - 1", () => {
    const role = makeRole({ startMonth: 3 });
    expect(isRoleActiveInMonth(role, 2)).toBe(false);
  });

  it("endMonth is inclusive: active at endMonth=6, inactive at month 7", () => {
    const role = makeRole({ startMonth: 0, endMonth: 6 });
    expect(isRoleActiveInMonth(role, 6)).toBe(true);
    expect(isRoleActiveInMonth(role, 7)).toBe(false);
  });

  it("undefined endMonth means permanent", () => {
    const role = makeRole({ startMonth: 0, endMonth: undefined });
    expect(isRoleActiveInMonth(role, 1_000)).toBe(true);
  });
});

describe("computeMonthlyBurn", () => {
  it("sums active roles + baseline - revenue", () => {
    const scenario = makeScenario({
      baselineBurn: 20_000,
      monthlyRevenue: 5_000,
      roles: [makeRole()],
    });
    // 19500 + 20000 - 5000 = 34500
    expect(computeMonthlyBurn(scenario, 0)).toBe(34_500);
  });

  it("is negative when revenue exceeds cost", () => {
    const scenario = makeScenario({
      monthlyRevenue: 100_000,
      baselineBurn: 10_000,
    });
    expect(computeMonthlyBurn(scenario, 0)).toBe(-90_000);
  });

  it("excludes roles outside their active window", () => {
    const scenario = makeScenario({
      roles: [makeRole({ startMonth: 6 })],
    });
    expect(computeMonthlyBurn(scenario, 5)).toBe(0);
    expect(computeMonthlyBurn(scenario, 6)).toBe(19_500);
  });
});

describe("computeCashSeries", () => {
  it("has length horizonMonths + 1", () => {
    const scenario = makeScenario({ horizonMonths: 24 });
    expect(computeCashSeries(scenario)).toHaveLength(25);
  });

  it("index 0 equals startingCash", () => {
    const scenario = makeScenario({ startingCash: 500_000, horizonMonths: 3 });
    expect(computeCashSeries(scenario)[0].cash).toBe(500_000);
  });

  it("decrements cash by burn each month", () => {
    const scenario = makeScenario({
      startingCash: 100_000,
      baselineBurn: 10_000,
      horizonMonths: 3,
    });
    const series = computeCashSeries(scenario);
    expect(series[0].cash).toBe(100_000);
    expect(series[1].cash).toBe(90_000);
    expect(series[2].cash).toBe(80_000);
    expect(series[3].cash).toBe(70_000);
  });
});

describe("computeRunwayMonths", () => {
  it("100k cash, 3 engineers at 180k (1.3 mult), 0 revenue, 20k baseline → ~1.274 months", () => {
    const scenario = makeScenario({
      startingCash: 100_000,
      baselineBurn: 20_000,
      roles: [
        makeRole({ id: "a" }),
        makeRole({ id: "b" }),
        makeRole({ id: "c" }),
      ],
    });
    // total burn/mo = 3*19500 + 20000 = 78500
    // cash[0]=100000, cash[1]=21500, cash[2]=-57000
    // runway = 1 + 21500 / 78500 ≈ 1.27388...
    expect(computeRunwayMonths(scenario)).toBeCloseTo(1.273_88, 4);
  });

  it("infinite runway (revenue > burn) returns null", () => {
    const scenario = makeScenario({
      startingCash: 1_000_000,
      monthlyRevenue: 100_000,
      baselineBurn: 10_000,
    });
    expect(computeRunwayMonths(scenario)).toBeNull();
  });

  it("empty scenario (no roles, no baseline, no revenue) returns null", () => {
    const scenario = makeScenario({ startingCash: 1_000_000 });
    expect(computeRunwayMonths(scenario)).toBeNull();
  });

  it("returns 0 when starting cash is already zero or negative", () => {
    const scenario = makeScenario({ startingCash: 0, baselineBurn: 1_000 });
    expect(computeRunwayMonths(scenario)).toBe(0);
  });

  it("returns null if horizon ends before cash crosses zero", () => {
    // Burns slowly, horizon is short.
    const scenario = makeScenario({
      startingCash: 1_000_000,
      baselineBurn: 1_000,
      horizonMonths: 12,
    });
    expect(computeRunwayMonths(scenario)).toBeNull();
  });
});

describe("computeZeroCashDate", () => {
  it("returns null when runway is null", () => {
    const scenario = makeScenario({
      startingCash: 1_000_000,
      monthlyRevenue: 100_000,
    });
    expect(computeZeroCashDate(scenario, new Date("2026-01-01"))).toBeNull();
  });

  it("advances the anchor date by runway months", () => {
    const scenario = makeScenario({
      startingCash: 100_000,
      baselineBurn: 50_000,
    });
    // runway = 2 exactly, cash crosses zero at month 2
    // 2 months ≈ 60.875 days
    const anchor = new Date("2026-01-01T00:00:00.000Z");
    const zero = computeZeroCashDate(scenario, anchor);
    expect(zero).not.toBeNull();
    const diffDays = (zero!.getTime() - anchor.getTime()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeCloseTo(60.875, 2);
  });
});
