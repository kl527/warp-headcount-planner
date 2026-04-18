import { Hono } from "hono";
import { cors } from "hono/cors";
import { customAlphabet } from "nanoid";
import {
  salaryBandsHandler,
  salaryLookupHandler,
  type LocationKey,
} from "./salaryBands";

// TODO: swap Map for Workers KV or D1 before this leaves local dev —
// in-memory state only survives within a single Worker isolate.
const store = new Map<string, StoredScenario>();

const shortCode = customAlphabet(
  "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  6,
);

type StoredScenario = {
  id: string;
  name: string;
  startingCash: number;
  monthlyRevenue: number;
  baselineBurn: number;
  horizonMonths: number;
  roles: unknown[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

function isScenarioShape(value: unknown): value is StoredScenario {
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

export interface Env {}

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (/^http:\/\/localhost:\d+$/.test(origin)) return origin;
      if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return origin;
      return "";
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["content-type"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/salary-bands", salaryBandsHandler);
app.get("/salary-bands/lookup", salaryLookupHandler);

const SF_BAY_CITIES = new Set([
  "san francisco",
  "oakland",
  "berkeley",
  "san jose",
  "palo alto",
  "mountain view",
  "sunnyvale",
  "redwood city",
  "san mateo",
  "daly city",
  "south san francisco",
]);
const NYC_CITIES = new Set([
  "new york",
  "new york city",
  "brooklyn",
  "queens",
  "bronx",
  "manhattan",
  "jersey city",
  "newark",
  "hoboken",
]);
const SEATTLE_CITIES = new Set(["seattle", "bellevue", "redmond", "kirkland"]);
const EUROPE_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "GB", "CH", "NO", "IS",
]);
const LATAM_COUNTRIES = new Set([
  "MX", "BR", "AR", "CL", "CO", "PE", "UY", "EC", "BO", "PY", "VE", "CR",
  "PA", "GT", "DO",
]);

function mapGeoToLocationKey(geo: {
  city: string | null;
  region: string | null;
  country: string | null;
}): LocationKey {
  const city = (geo.city ?? "").toLowerCase();
  const region = (geo.region ?? "").toLowerCase();
  const country = (geo.country ?? "").toUpperCase();
  if (country === "US") {
    if (region === "new york") return "NYC";
    if (region === "california") return "SF";
    if (region === "washington") return "Seattle";
    if (SF_BAY_CITIES.has(city)) return "SF";
    if (NYC_CITIES.has(city)) return "NYC";
    if (SEATTLE_CITIES.has(city)) return "Seattle";
    return "Remote US";
  }
  if (EUROPE_COUNTRIES.has(country)) return "Europe";
  if (LATAM_COUNTRIES.has(country)) return "LATAM";
  return "SF";
}

app.get("/geo", (c) => {
  const cf = (c.req.raw as unknown as { cf?: Record<string, unknown> }).cf;
  const city = typeof cf?.city === "string" ? cf.city : null;
  const region = typeof cf?.region === "string" ? cf.region : null;
  const country = typeof cf?.country === "string" ? cf.country : null;
  const key = mapGeoToLocationKey({ city, region, country });
  console.log("[geo]", {
    origin: c.req.header("origin") ?? null,
    cfPresent: cf !== undefined,
    city,
    region,
    country,
    key,
  });
  c.header("Cache-Control", "no-store");
  return c.json({ city, region, country, key });
});

app.post("/scenarios", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (!isScenarioShape(body)) {
    return c.json({ error: "invalid_scenario_shape" }, 400);
  }
  const code = shortCode();
  store.set(code, body);
  return c.json({ id: body.id, shortCode: code });
});

app.get("/scenarios/:shortCode", (c) => {
  const code = c.req.param("shortCode");
  const scenario = store.get(code);
  if (!scenario) {
    return c.json({ error: "not_found" }, 404);
  }
  return c.json(scenario);
});

export default app satisfies ExportedHandler<Env>;
