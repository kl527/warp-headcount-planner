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

interface SendEmailBinding {
  send(message: {
    to: string | string[];
    from: string | { email: string; name: string };
    subject: string;
    html?: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string | { email: string; name: string };
  }): Promise<{ messageId?: string }>;
}

export interface Env {
  DB: D1Database;
  EMAIL: SendEmailBinding;
  SHARE_FROM_EMAIL: string;
}

const MAX_HTML_BYTES = 600_000; // generous cap for the inline SVG deck

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
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

app.post("/share-emails", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return c.json({ error: "invalid_body" }, 400);
  }
  const { email, shareUrl, scenarioName } = body as {
    email?: unknown;
    shareUrl?: unknown;
    scenarioName?: unknown;
  };
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return c.json({ error: "invalid_email" }, 400);
  }
  const normalized = email.trim().toLowerCase();
  const url = typeof shareUrl === "string" ? shareUrl : null;
  const name =
    typeof scenarioName === "string" && scenarioName.trim().length > 0
      ? scenarioName.trim().slice(0, 60)
      : null;

  let insertedId: number | null = null;
  try {
    const result = await c.env.DB.prepare(
      "INSERT INTO share_emails (email, share_url, scenario_name) VALUES (?, ?, ?)",
    )
      .bind(normalized, url, name)
      .run();
    const lastId = (result.meta as { last_row_id?: number } | undefined)
      ?.last_row_id;
    if (typeof lastId === "number") insertedId = lastId;
  } catch (err) {
    console.error("[share-emails] insert failed", err);
    return c.json({ error: "storage_failed" }, 500);
  }
  return c.json({ ok: true, id: insertedId });
});

app.post("/share-deck", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return c.json({ error: "invalid_body" }, 400);
  }
  const { email, shareUrl, subject, html, scenarioName } = body as {
    email?: unknown;
    shareUrl?: unknown;
    subject?: unknown;
    html?: unknown;
    scenarioName?: unknown;
  };
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return c.json({ error: "invalid_email" }, 400);
  }
  if (typeof html !== "string" || html.length === 0) {
    return c.json({ error: "invalid_html" }, 400);
  }
  if (html.length > MAX_HTML_BYTES) {
    return c.json({ error: "html_too_large" }, 413);
  }
  const normalized = email.trim().toLowerCase();
  const url = typeof shareUrl === "string" ? shareUrl : null;
  const subj =
    typeof subject === "string" && subject.trim().length > 0
      ? subject.trim()
      : "Your runway plan";
  const name =
    typeof scenarioName === "string" && scenarioName.trim().length > 0
      ? scenarioName.trim().slice(0, 60)
      : null;

  let insertedId: number | null = null;
  try {
    const result = await c.env.DB.prepare(
      "INSERT INTO share_emails (email, share_url, scenario_name) VALUES (?, ?, ?)",
    )
      .bind(normalized, url, name)
      .run();
    const lastId = (result.meta as { last_row_id?: number } | undefined)
      ?.last_row_id;
    if (typeof lastId === "number") insertedId = lastId;
  } catch (err) {
    console.error("[share-deck] d1 insert failed", err);
    // Keep going — email matters more than logging.
  }

  const from = c.env.SHARE_FROM_EMAIL;
  if (!from) {
    console.error("[share-deck] missing SHARE_FROM_EMAIL");
    return c.json({ error: "email_not_configured" }, 500);
  }

  try {
    await c.env.EMAIL.send({
      to: normalized,
      from,
      subject: subj,
      html,
    });
  } catch (err) {
    console.error("[share-deck] send error", err);
    return c.json({ error: "email_failed" }, 502);
  }

  return c.json({ ok: true, id: insertedId });
});

app.get("/share-emails", async (c) => {
  const emailParam = c.req.query("email");
  if (typeof emailParam !== "string" || !EMAIL_RE.test(emailParam.trim())) {
    return c.json({ error: "invalid_email" }, 400);
  }
  const normalized = emailParam.trim().toLowerCase();

  let rows: {
    id: number;
    scenario_name: string | null;
    share_url: string | null;
    created_at: string;
  }[] = [];
  try {
    const result = await c.env.DB.prepare(
      "SELECT id, scenario_name, share_url, created_at FROM share_emails WHERE email = ? ORDER BY created_at DESC LIMIT 20",
    )
      .bind(normalized)
      .all();
    rows = (result.results ?? []) as typeof rows;
  } catch (err) {
    console.error("[share-emails] select failed", err);
    return c.json({ error: "storage_failed" }, 500);
  }

  const scenarios = rows
    .filter((r) => typeof r.share_url === "string" && r.share_url.length > 0)
    .map((r) => ({
      id: r.id,
      name: r.scenario_name,
      shareUrl: r.share_url as string,
      createdAt: r.created_at,
    }));

  c.header("Cache-Control", "no-store");
  return c.json({ scenarios });
});

app.patch("/share-emails/:id/name", async (c) => {
  const idStr = c.req.param("id");
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "invalid_id" }, 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return c.json({ error: "invalid_body" }, 400);
  }
  const { email, name } = body as { email?: unknown; name?: unknown };
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return c.json({ error: "invalid_email" }, 400);
  }
  if (typeof name !== "string") {
    return c.json({ error: "invalid_name" }, 400);
  }
  const trimmed = name.trim().slice(0, 60);
  const normalized = email.trim().toLowerCase();

  try {
    const result = await c.env.DB.prepare(
      "UPDATE share_emails SET scenario_name = ? WHERE id = ? AND email = ?",
    )
      .bind(trimmed.length > 0 ? trimmed : null, id, normalized)
      .run();
    const changes = (result.meta as { changes?: number } | undefined)
      ?.changes ?? 0;
    if (changes === 0) return c.json({ error: "not_found" }, 404);
  } catch (err) {
    console.error("[share-emails] rename failed", err);
    return c.json({ error: "storage_failed" }, 500);
  }

  return c.json({ ok: true, name: trimmed.length > 0 ? trimmed : null });
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
