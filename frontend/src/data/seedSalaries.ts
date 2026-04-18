/**
 * Starter scenario used to seed the store on first load.
 *
 * Salary bands (by role family × level × location) live on the backend and
 * are fetched through `src/lib/salaryApi.ts`. The numbers below are the
 * baseline Series A SF figures (software-engineer / Senior at p50) used to
 * prime the default scenario before the catalog is available.
 */
import type { Scenario } from "../types/scenario";

export type { Percentile } from "../lib/salaryApi";

const DEFAULT_SCENARIO_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export const DEFAULT_SCENARIO: Scenario = {
  id: "default-scenario",
  name: "Starter plan",
  startingCash: 2_000_000,
  monthlyRevenue: 0,
  baselineBurn: 30_000,
  horizonMonths: 24,
  roles: [
    {
      id: "seed-eng-1",
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "SF",
      level: "Senior",
      baseSalary: 220_000,
      benefitsMultiplier: 1.3,
      startMonth: 0,
    },
    {
      id: "seed-eng-2",
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "SF",
      level: "Senior",
      baseSalary: 220_000,
      benefitsMultiplier: 1.3,
      startMonth: 0,
    },
  ],
  createdAt: DEFAULT_SCENARIO_TIMESTAMP,
  updatedAt: DEFAULT_SCENARIO_TIMESTAMP,
};
