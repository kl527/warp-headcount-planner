import type { Location } from "../types/scenario";

export const LOCATION_MULTIPLIERS: Record<Location, number> = {
  SF: 1.0,
  NYC: 1.0,
  Seattle: 0.95,
  "Remote US": 0.85,
  Europe: 0.65,
  LATAM: 0.45,
};
