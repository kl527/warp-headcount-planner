import { useEffect, useState } from "react";
import { getBackendBaseUrl } from "./backend";
import type { LocationKey } from "./salaryApi";

export type DetectedLocation = {
  key: LocationKey;
  city: string | null;
  region: string | null;
  country: string | null;
};

const VALID_KEYS: ReadonlySet<LocationKey> = new Set([
  "SF",
  "NYC",
  "Seattle",
  "Remote US",
  "Europe",
  "LATAM",
]);

export function isLocationKey(v: unknown): v is LocationKey {
  return typeof v === "string" && VALID_KEYS.has(v as LocationKey);
}

let geoPromise: Promise<DetectedLocation> | null = null;

export function fetchUserLocation(): Promise<DetectedLocation> {
  if (!geoPromise) {
    const url = `${getBackendBaseUrl()}/geo`;
    console.log("[geo] fetching", url);
    geoPromise = fetch(url)
      .then(async (r) => {
        console.log("[geo] response", r.status, r.statusText);
        if (!r.ok) throw new Error(`geo ${r.status}`);
        const body = (await r.json()) as DetectedLocation;
        console.log("[geo] body", body);
        return body;
      })
      .catch((err) => {
        console.error("[geo] fetch failed", err);
        geoPromise = null;
        throw err;
      });
  }
  return geoPromise;
}

export function useResolvedLocation(): LocationKey | null {
  const [resolved, setResolved] = useState<LocationKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchUserLocation()
      .then((loc) => {
        if (cancelled) return;
        console.log("[geo] resolved from IP ->", loc.key);
        setResolved(loc.key);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[geo] falling back to SF after error:", err);
        setResolved("SF");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return resolved;
}
