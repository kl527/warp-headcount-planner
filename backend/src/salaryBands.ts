/**
 * Startup salary benchmarks, keyed by role family × level.
 *
 * Baseline is a Series A–B, Zone 1 (SF / NYC) US company. Numbers are
 * annualized USD, rounded to $5K. Base compensation unless the family is
 * marked `compType: "ote"` (SDR / AE / Sales Manager include variable).
 *
 * Location adjustment is applied at lookup time via LOCATION_MULTIPLIERS —
 * keep that map in sync with `frontend/src/data/locations.ts`.
 *
 * Sources (H1 2025):
 *  - Carta, State of Startup Compensation — primary anchor for IC/Senior/
 *    Manager bands across Engineering, Product, Design, Data.
 *  - Pave, Startup Benchmarks summaries — cross-check for GTM OTE splits.
 *  - Levels.fyi startup percentiles — Staff+ ceilings, ML / Platform / Sec.
 *  - YC Startup Compensation guide — early-stage IC sanity check.
 */
import type { Context } from "hono";

export type Level = "IC" | "Senior" | "Staff" | "Manager";
export type Team =
  | "Engineering"
  | "Product"
  | "Design"
  | "Data"
  | "GTM"
  | "Ops";
export type LocationKey =
  | "SF"
  | "NYC"
  | "Seattle"
  | "Remote US"
  | "Europe"
  | "LATAM";
export type CompType = "base" | "ote";

export type SalaryBand = { p25: number; p50: number; p75: number };
export type Percentile = "p25" | "p50" | "p75";

export type RoleFamily = {
  key: string;
  displayName: string;
  team: Team;
  compType: CompType;
  aliases: string[];
  levels: Partial<Record<Level, SalaryBand>>;
  note?: string;
};

export const LOCATION_MULTIPLIERS: Record<LocationKey, number> = {
  SF: 1.0,
  NYC: 1.0,
  Seattle: 0.95,
  "Remote US": 0.88,
  Europe: 0.7,
  LATAM: 0.5,
};

export const SOURCES = [
  "Carta, State of Startup Compensation H1 2025 (Series A–B, Zone 1 baseline)",
  "Pave, Startup Benchmarks 2025 (GTM OTE cross-check)",
  "Levels.fyi startup percentiles (Staff+ / ML / Platform ceilings)",
  "YC Startup Compensation guide (early-stage IC anchor)",
];

export const SOURCE_STAGE = "Series A–B, Zone 1 (SF/NYC) baseline, 2025";

export const ROLE_FAMILIES: RoleFamily[] = [
  // Engineering
  {
    key: "software-engineer",
    displayName: "Software Engineer",
    team: "Engineering",
    compType: "base",
    aliases: [
      "Software Engineer",
      "Backend Engineer",
      "Frontend Engineer",
      "Fullstack Engineer",
      "Mobile Engineer",
      "Senior Backend Engineer",
      "Senior Frontend Engineer",
      "Staff Backend Engineer",
      "Staff Frontend Engineer",
    ],
    levels: {
      IC: { p25: 150_000, p50: 170_000, p75: 195_000 },
      Senior: { p25: 190_000, p50: 220_000, p75: 255_000 },
      Staff: { p25: 240_000, p50: 285_000, p75: 330_000 },
    },
  },
  {
    key: "platform-engineer",
    displayName: "Platform / Infrastructure Engineer",
    team: "Engineering",
    compType: "base",
    aliases: [
      "Platform Engineer",
      "Infrastructure Engineer",
      "DevOps Engineer",
      "SRE",
      "Site Reliability Engineer",
      "Staff Platform Engineer",
    ],
    levels: {
      Senior: { p25: 200_000, p50: 235_000, p75: 270_000 },
      Staff: { p25: 250_000, p50: 295_000, p75: 345_000 },
    },
    note: "Platform / SRE carries a ~5–10% premium over generalist SWE at Senior+ per Levels.fyi.",
  },
  {
    key: "ml-engineer",
    displayName: "Machine Learning Engineer",
    team: "Engineering",
    compType: "base",
    aliases: [
      "Machine Learning Engineer",
      "ML Engineer",
      "Applied Scientist",
      "AI Engineer",
    ],
    levels: {
      IC: { p25: 170_000, p50: 195_000, p75: 225_000 },
      Senior: { p25: 210_000, p50: 250_000, p75: 290_000 },
      Staff: { p25: 270_000, p50: 320_000, p75: 370_000 },
    },
    note: "ML carries a clear premium over generalist SWE across the ladder (Carta + Levels.fyi).",
  },
  {
    key: "security-engineer",
    displayName: "Security Engineer",
    team: "Engineering",
    compType: "base",
    aliases: ["Security Engineer", "AppSec Engineer", "Product Security Engineer"],
    levels: {
      Senior: { p25: 200_000, p50: 235_000, p75: 275_000 },
      Staff: { p25: 250_000, p50: 295_000, p75: 345_000 },
    },
  },
  {
    key: "engineering-manager",
    displayName: "Engineering Manager",
    team: "Engineering",
    compType: "base",
    aliases: ["Engineering Manager", "EM", "Director of Engineering"],
    levels: {
      Manager: { p25: 240_000, p50: 280_000, p75: 320_000 },
    },
  },

  // Product
  {
    key: "product-manager",
    displayName: "Product Manager",
    team: "Product",
    compType: "base",
    aliases: ["Product Manager", "PM", "Senior Product Manager"],
    levels: {
      IC: { p25: 150_000, p50: 175_000, p75: 200_000 },
      Senior: { p25: 180_000, p50: 215_000, p75: 250_000 },
      Staff: { p25: 230_000, p50: 270_000, p75: 310_000 },
    },
  },
  {
    key: "group-product-manager",
    displayName: "Group Product Manager",
    team: "Product",
    compType: "base",
    aliases: ["Group Product Manager", "GPM", "Head of Product"],
    levels: {
      Manager: { p25: 240_000, p50: 280_000, p75: 320_000 },
    },
  },

  // Design
  {
    key: "product-designer",
    displayName: "Product Designer",
    team: "Design",
    compType: "base",
    aliases: ["Product Designer", "UX Designer", "UI Designer"],
    levels: {
      IC: { p25: 140_000, p50: 165_000, p75: 190_000 },
      Senior: { p25: 175_000, p50: 205_000, p75: 235_000 },
      Staff: { p25: 220_000, p50: 255_000, p75: 290_000 },
    },
  },
  {
    key: "brand-designer",
    displayName: "Brand Designer",
    team: "Design",
    compType: "base",
    aliases: ["Brand Designer", "Visual Designer", "Marketing Designer"],
    levels: {
      IC: { p25: 130_000, p50: 155_000, p75: 180_000 },
      Senior: { p25: 165_000, p50: 195_000, p75: 225_000 },
    },
  },
  {
    key: "content-designer",
    displayName: "Content Designer",
    team: "Design",
    compType: "base",
    aliases: ["Content Designer", "UX Writer", "Content Strategist"],
    levels: {
      IC: { p25: 135_000, p50: 160_000, p75: 185_000 },
      Senior: { p25: 165_000, p50: 195_000, p75: 225_000 },
    },
  },
  {
    key: "design-manager",
    displayName: "Design Manager",
    team: "Design",
    compType: "base",
    aliases: ["Design Manager", "Head of Design"],
    levels: {
      Manager: { p25: 215_000, p50: 250_000, p75: 290_000 },
    },
  },

  // Data
  {
    key: "data-analyst",
    displayName: "Data Analyst",
    team: "Data",
    compType: "base",
    aliases: ["Data Analyst", "Business Analyst"],
    levels: {
      IC: { p25: 120_000, p50: 145_000, p75: 170_000 },
      Senior: { p25: 155_000, p50: 185_000, p75: 215_000 },
    },
  },
  {
    key: "analytics-engineer",
    displayName: "Analytics Engineer",
    team: "Data",
    compType: "base",
    aliases: ["Analytics Engineer"],
    levels: {
      IC: { p25: 140_000, p50: 165_000, p75: 195_000 },
      Senior: { p25: 175_000, p50: 210_000, p75: 245_000 },
    },
  },
  {
    key: "data-scientist",
    displayName: "Data Scientist",
    team: "Data",
    compType: "base",
    aliases: ["Data Scientist", "Senior Data Scientist"],
    levels: {
      IC: { p25: 150_000, p50: 175_000, p75: 200_000 },
      Senior: { p25: 190_000, p50: 225_000, p75: 260_000 },
      Staff: { p25: 245_000, p50: 290_000, p75: 335_000 },
    },
  },

  // GTM
  {
    key: "sdr",
    displayName: "SDR / BDR",
    team: "GTM",
    compType: "ote",
    aliases: ["SDR", "BDR", "Sales Development Rep", "Business Development Rep"],
    levels: {
      IC: { p25: 90_000, p50: 115_000, p75: 140_000 },
    },
    note: "OTE (on-target earnings) with a ~65/35 base/variable split typical at Series A–B.",
  },
  {
    key: "account-executive",
    displayName: "Account Executive",
    team: "GTM",
    compType: "ote",
    aliases: ["Account Executive", "AE", "Enterprise AE"],
    levels: {
      IC: { p25: 170_000, p50: 210_000, p75: 250_000 },
      Senior: { p25: 220_000, p50: 275_000, p75: 325_000 },
    },
    note: "OTE with a 50/50 base/variable split. Enterprise AEs cluster at the upper end (Pave).",
  },
  {
    key: "solutions-engineer",
    displayName: "Solutions Engineer",
    team: "GTM",
    compType: "base",
    aliases: ["Solutions Engineer", "Sales Engineer"],
    levels: {
      IC: { p25: 160_000, p50: 190_000, p75: 220_000 },
      Senior: { p25: 200_000, p50: 240_000, p75: 280_000 },
    },
    note: "Base-heavy relative to AE; variable component (when present) is smaller.",
  },
  {
    key: "customer-success-manager",
    displayName: "Customer Success Manager",
    team: "GTM",
    compType: "base",
    aliases: ["Customer Success Manager", "CSM"],
    levels: {
      IC: { p25: 110_000, p50: 135_000, p75: 160_000 },
      Senior: { p25: 140_000, p50: 170_000, p75: 200_000 },
    },
  },
  {
    key: "sales-manager",
    displayName: "Sales Manager",
    team: "GTM",
    compType: "ote",
    aliases: ["Sales Manager", "Head of Sales", "VP Sales"],
    levels: {
      Manager: { p25: 280_000, p50: 340_000, p75: 400_000 },
    },
    note: "OTE; VP-level roles skew higher with equity carrying more weight than cash.",
  },

  // Ops
  {
    key: "recruiter",
    displayName: "Recruiter",
    team: "Ops",
    compType: "base",
    aliases: ["Recruiter", "Technical Recruiter", "Senior Recruiter"],
    levels: {
      IC: { p25: 125_000, p50: 150_000, p75: 175_000 },
      Senior: { p25: 160_000, p50: 190_000, p75: 220_000 },
    },
  },
  {
    key: "people-partner",
    displayName: "People Partner / HRBP",
    team: "Ops",
    compType: "base",
    aliases: ["People Partner", "HRBP", "People Operations"],
    levels: {
      IC: { p25: 120_000, p50: 145_000, p75: 170_000 },
      Senior: { p25: 160_000, p50: 195_000, p75: 225_000 },
    },
  },
  {
    key: "revenue-operations",
    displayName: "Revenue Operations",
    team: "Ops",
    compType: "base",
    aliases: ["Revenue Operations", "RevOps", "Sales Operations"],
    levels: {
      IC: { p25: 130_000, p50: 155_000, p75: 180_000 },
      Senior: { p25: 165_000, p50: 195_000, p75: 225_000 },
    },
  },
  {
    key: "finance-ops",
    displayName: "Finance / Business Operations",
    team: "Ops",
    compType: "base",
    aliases: [
      "Finance Ops Lead",
      "Business Operations",
      "BizOps",
      "Finance Manager",
      "Strategic Finance",
    ],
    levels: {
      IC: { p25: 130_000, p50: 160_000, p75: 185_000 },
      Senior: { p25: 165_000, p50: 200_000, p75: 235_000 },
    },
  },
  {
    key: "chief-of-staff",
    displayName: "Chief of Staff",
    team: "Ops",
    compType: "base",
    aliases: ["Chief of Staff", "CoS"],
    levels: {
      Senior: { p25: 180_000, p50: 220_000, p75: 260_000 },
      Manager: { p25: 220_000, p50: 265_000, p75: 310_000 },
    },
  },
];

const LEVELS: readonly Level[] = ["IC", "Senior", "Staff", "Manager"];
const LOCATION_KEYS = Object.keys(LOCATION_MULTIPLIERS) as LocationKey[];

export function isLevel(v: unknown): v is Level {
  return typeof v === "string" && (LEVELS as readonly string[]).includes(v);
}

export function isLocationKey(v: unknown): v is LocationKey {
  return typeof v === "string" && (LOCATION_KEYS as string[]).includes(v);
}

export function findFamily(roleKey: string): RoleFamily | undefined {
  return ROLE_FAMILIES.find((f) => f.key === roleKey);
}

export type LookupResult = {
  role: string;
  displayName: string;
  team: Team;
  level: Level;
  location: LocationKey;
  compType: CompType;
  range: SalaryBand;
  multiplier: number;
  sourceStage: string;
  note?: string;
};

function roundTo1K(n: number): number {
  return Math.round(n / 1000) * 1000;
}

export function lookupBand(
  roleKey: string,
  level: Level,
  location: LocationKey,
): LookupResult | { error: "unknown_role" | "unknown_level" } {
  const family = findFamily(roleKey);
  if (!family) return { error: "unknown_role" };
  const band = family.levels[level];
  if (!band) return { error: "unknown_level" };
  const m = LOCATION_MULTIPLIERS[location];
  return {
    role: family.key,
    displayName: family.displayName,
    team: family.team,
    level,
    location,
    compType: family.compType,
    range: {
      p25: roundTo1K(band.p25 * m),
      p50: roundTo1K(band.p50 * m),
      p75: roundTo1K(band.p75 * m),
    },
    multiplier: m,
    sourceStage: SOURCE_STAGE,
    note: family.note,
  };
}

export function salaryCatalog() {
  return {
    families: ROLE_FAMILIES,
    locations: LOCATION_MULTIPLIERS,
    levels: LEVELS,
    sources: SOURCES,
    sourceStage: SOURCE_STAGE,
  };
}

export function salaryBandsHandler(c: Context) {
  c.header("Cache-Control", "public, max-age=300");
  return c.json(salaryCatalog());
}

export function salaryLookupHandler(c: Context) {
  const roleKey = c.req.query("role");
  const levelParam = c.req.query("level");
  const locationParam = c.req.query("location");

  if (!roleKey || !levelParam || !locationParam) {
    return c.json(
      { error: "missing_params", required: ["role", "level", "location"] },
      400,
    );
  }
  if (!isLevel(levelParam)) {
    return c.json({ error: "invalid_level", allowed: LEVELS }, 400);
  }
  if (!isLocationKey(locationParam)) {
    return c.json(
      { error: "invalid_location", allowed: LOCATION_KEYS },
      400,
    );
  }

  const result = lookupBand(roleKey, levelParam, locationParam);
  if ("error" in result) {
    return c.json({ error: result.error }, 404);
  }
  c.header("Cache-Control", "public, max-age=300");
  return c.json(result);
}
