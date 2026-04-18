/**
 * Client for the backend salary-band catalog.
 *
 * The catalog is served by `backend/src/salaryBands.ts` at `/salary-bands`.
 * It's small (~24 role families), rarely changes, and every add-team-member
 * interaction wants the same data — so we fetch once, memoize at module
 * scope, and expose a pure `getSalaryRange` lookup for components.
 */
import { useEffect, useState } from "react";
import { getBackendBaseUrl } from "./backend";

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
export type Percentile = "p25" | "p50" | "p75";

export type SalaryBand = { p25: number; p50: number; p75: number };

export type RoleFamily = {
  key: string;
  displayName: string;
  team: Team;
  compType: CompType;
  aliases: string[];
  levels: Partial<Record<Level, SalaryBand>>;
  note?: string;
};

export type SalaryCatalog = {
  families: RoleFamily[];
  locations: Record<LocationKey, number>;
  levels: readonly Level[];
  sources: string[];
  sourceStage: string;
};

export type SalaryRange = {
  range: SalaryBand;
  compType: CompType;
  multiplier: number;
  displayName: string;
  note?: string;
};

let catalogPromise: Promise<SalaryCatalog> | null = null;

export function fetchSalaryCatalog(): Promise<SalaryCatalog> {
  if (!catalogPromise) {
    catalogPromise = fetch(`${getBackendBaseUrl()}/salary-bands`)
      .then((r) => {
        if (!r.ok) throw new Error(`salary-bands ${r.status}`);
        return r.json() as Promise<SalaryCatalog>;
      })
      .catch((err) => {
        catalogPromise = null;
        throw err;
      });
  }
  return catalogPromise;
}

function roundTo1K(n: number): number {
  return Math.round(n / 1000) * 1000;
}

export function findFamily(
  catalog: SalaryCatalog,
  roleKey: string,
): RoleFamily | undefined {
  return catalog.families.find((f) => f.key === roleKey);
}

export function findFamilyByTitle(
  catalog: SalaryCatalog,
  title: string,
): RoleFamily | undefined {
  const needle = title.trim().toLowerCase();
  return catalog.families.find(
    (f) =>
      f.displayName.toLowerCase() === needle ||
      f.aliases.some((a) => a.toLowerCase() === needle),
  );
}

export function getSalaryRange(
  catalog: SalaryCatalog,
  roleKey: string,
  level: Level,
  location: LocationKey,
): SalaryRange | undefined {
  const family = findFamily(catalog, roleKey);
  if (!family) return undefined;
  const band = family.levels[level];
  if (!band) return undefined;
  const m = catalog.locations[location];
  return {
    range: {
      p25: roundTo1K(band.p25 * m),
      p50: roundTo1K(band.p50 * m),
      p75: roundTo1K(band.p75 * m),
    },
    compType: family.compType,
    multiplier: m,
    displayName: family.displayName,
    note: family.note,
  };
}

export function pickPercentile(
  range: SalaryBand,
  percentile: Percentile = "p50",
): number {
  return range[percentile];
}

type CatalogState =
  | { status: "loading"; catalog: null; error: null }
  | { status: "ready"; catalog: SalaryCatalog; error: null }
  | { status: "error"; catalog: null; error: Error };

export function useSalaryCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({
    status: "loading",
    catalog: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetchSalaryCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setState({ status: "ready", catalog, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ status: "error", catalog: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function _resetCatalogCacheForTests(): void {
  catalogPromise = null;
}
