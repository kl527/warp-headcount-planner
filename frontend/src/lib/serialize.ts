import lzString from "lz-string";
import type { Scenario } from "../types/scenario";

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } =
  lzString;

export function encodeScenario(scenario: Scenario): string {
  return compressToEncodedURIComponent(JSON.stringify(scenario));
}

export function decodeScenario(token: string): Scenario | null {
  if (!token) return null;
  let raw: string | null;
  try {
    raw = decompressFromEncodedURIComponent(token);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isScenarioShape(parsed)) return null;
  return parsed;
}

export function scenarioToShareUrl(scenario: Scenario, baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return `${trimmed}/s#${encodeScenario(scenario)}`;
}

export function shareUrlToScenario(url: string): Scenario | null {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return null;
  const token = url.slice(hashIndex + 1);
  return decodeScenario(token);
}

function isScenarioShape(value: unknown): value is Scenario {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.startingCash === "number" &&
    typeof v.monthlyRevenue === "number" &&
    typeof v.baselineBurn === "number" &&
    typeof v.horizonMonths === "number" &&
    Array.isArray(v.roles)
  );
}
