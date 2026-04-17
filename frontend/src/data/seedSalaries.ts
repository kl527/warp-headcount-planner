/**
 * Market salary bands (SF, USD) and a helper to apply a location multiplier.
 *
 * p50 values are drawn from rough market data as of early 2026. p25 and p75
 * are spread ~15% below/above p50 and rounded to the nearest $5k to read
 * like real bands. Numbers are base compensation; consumers choose a
 * `benefitsMultiplier` on the Role when building a scenario (commonly
 * 1.25–1.35 to cover payroll taxes, benefits, and equipment). Roles marked
 * "total comp" already include variable / OTE and are not typical "base".
 */

import type { Location, Scenario } from "../types/scenario";
import { LOCATION_MULTIPLIERS } from "./locations";

export type Percentile = "p25" | "p50" | "p75";

export type SalaryBand = {
  title: string;
  p25: number;
  p50: number;
  p75: number;
  note?: string;
};

export const SALARY_BANDS = [
  { title: "Software Engineer (IC3)", p25: 155_000, p50: 180_000, p75: 205_000 },
  { title: "Senior Software Engineer (IC4)", p25: 195_000, p50: 230_000, p75: 265_000 },
  { title: "Staff Software Engineer (IC5)", p25: 245_000, p50: 290_000, p75: 335_000 },
  { title: "Engineering Manager", p25: 220_000, p50: 260_000, p75: 300_000 },
  { title: "Product Designer", p25: 150_000, p50: 175_000, p75: 200_000 },
  { title: "Product Manager", p25: 165_000, p50: 195_000, p75: 225_000 },
  { title: "Account Executive", p25: 240_000, p50: 280_000, p75: 320_000, note: "total comp (OTE)" },
  { title: "SDR", p25: 100_000, p50: 120_000, p75: 140_000, note: "total comp (OTE)" },
  { title: "Technical Recruiter", p25: 130_000, p50: 150_000, p75: 175_000 },
  { title: "Chief of Staff", p25: 185_000, p50: 220_000, p75: 255_000 },
  { title: "Marketing Manager", p25: 135_000, p50: 160_000, p75: 185_000 },
  { title: "Operations Lead", p25: 145_000, p50: 170_000, p75: 195_000 },
] as const satisfies readonly SalaryBand[];

export function salaryFor(
  title: string,
  location: Location,
  percentile: Percentile = "p50",
): number {
  const band = SALARY_BANDS.find((b) => b.title === title);
  if (!band) {
    throw new Error(`Unknown role title: ${title}`);
  }
  const multiplier = LOCATION_MULTIPLIERS[location];
  return Math.round(band[percentile] * multiplier);
}

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
      title: "Senior Software Engineer (IC4)",
      department: "Engineering",
      location: "SF",
      baseSalary: 230_000,
      benefitsMultiplier: 1.3,
      startMonth: 0,
    },
    {
      id: "seed-eng-2",
      title: "Senior Software Engineer (IC4)",
      department: "Engineering",
      location: "SF",
      baseSalary: 230_000,
      benefitsMultiplier: 1.3,
      startMonth: 0,
    },
  ],
  createdAt: DEFAULT_SCENARIO_TIMESTAMP,
  updatedAt: DEFAULT_SCENARIO_TIMESTAMP,
};
