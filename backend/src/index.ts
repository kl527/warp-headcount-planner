import { generateText } from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { customAlphabet } from "nanoid";
import { createWorkersAI } from "workers-ai-provider";
import {
  salaryBandsHandler,
  salaryLookupHandler,
  type LocationKey,
} from "./salaryBands";

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
  DECK_ASSETS: R2Bucket;
  AI: Ai;
  SHARE_FROM_EMAIL: string;
  ALLOWED_ORIGINS?: string;
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
}

async function capturePosthog(
  env: Env,
  event: string,
  distinctId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const apiKey = env.POSTHOG_API_KEY;
  if (!apiKey) return;
  const host = env.POSTHOG_HOST ?? "https://us.i.posthog.com";
  try {
    await fetch(`${host.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: { ...properties, source: "backend" },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("[posthog] capture failed", err);
  }
}

function isAllowedOrigin(origin: string, allowlist: string[]): boolean {
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return true;
  for (const entry of allowlist) {
    if (!entry) continue;
    if (entry === origin) return true;
    // Support wildcard subdomain patterns like https://*.vercel.app
    if (entry.includes("*")) {
      const pattern = new RegExp(
        "^" + entry.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^.]+") + "$",
      );
      if (pattern.test(origin)) return true;
    }
  }
  return false;
}

const MAX_HTML_BYTES = 600_000; // generous cap for the inline SVG deck
const MAX_ASSET_BYTES = 1_000_000; // 1MB cap per chart PNG

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  const allowlist = (c.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return cors({
    origin: (origin) => {
      if (!origin) return origin;
      return isAllowedOrigin(origin, allowlist) ? origin : "";
    },
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["content-type"],
  })(c, next);
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.post("/runway-insight", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return c.json({ error: "invalid_body" }, 400);
  }
  const { companyBalance, mrr, momGrowthPct, runwayMonths } = body as {
    companyBalance?: unknown;
    mrr?: unknown;
    momGrowthPct?: unknown;
    runwayMonths?: unknown;
  };
  if (
    typeof companyBalance !== "number" ||
    typeof mrr !== "number" ||
    typeof momGrowthPct !== "number"
  ) {
    return c.json({ error: "invalid_metrics" }, 400);
  }
  const runway =
    typeof runwayMonths === "number"
      ? `${runwayMonths.toFixed(1)} months`
      : "12+ months";

  const workersai = createWorkersAI({ binding: c.env.AI });
  const fmtUsd = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${Math.round(n / 1_000)}k`
        : `$${Math.round(n)}`;

  const userPrompt = [
    `Company balance: ${fmtUsd(companyBalance)}`,
    `MRR: ${fmtUsd(mrr)}`,
    `MoM growth: ${momGrowthPct.toFixed(1)}%`,
    `Runway: ${runway}`,
    "",
    "Respond with ONE sentence (max 22 words), plain text only, no quotes, no preamble.",
    'Format: "Companies like yours typically <concrete recommendation tied to a month, role, or dollar number>."',
  ].join("\n");

  try {
    const { text } = await generateText({
      model: workersai("@cf/openai/gpt-oss-120b"),
      system:
        "You are a concise startup finance advisor. Output one specific, data-aware recommendation about hiring cadence, spend discipline, or runway extension. No greetings, no caveats, no lists.",
      prompt: userPrompt,
      maxOutputTokens: 80,
      temperature: 0.7,
    });
    const insight = text
      .replace(/^["'\s]+|["'\s]+$/g, "")
      .split("\n")[0]
      .trim();
    return c.json({ insight });
  } catch (err) {
    console.error("[runway-insight] generation failed", err);
    return c.json({ error: "generation_failed" }, 502);
  }
});

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
  try {
    await c.env.DB.prepare(
      "INSERT INTO scenarios (short_code, payload) VALUES (?, ?)",
    )
      .bind(code, JSON.stringify(body))
      .run();
  } catch (err) {
    console.error("[scenarios] insert failed", err);
    return c.json({ error: "storage_failed" }, 500);
  }
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
    c.executionCtx.waitUntil(
      capturePosthog(c.env, "share_deck_delivery_failed", normalized, {
        scenario_name: name,
        reason: "email_send_threw",
      }),
    );
    return c.json({ error: "email_failed" }, 502);
  }

  // Fire-and-forget — we've already sent the email; don't block the response
  // on PostHog ingestion. distinct_id = email so this event joins the frontend
  // identify() call on the same user.
  c.executionCtx.waitUntil(
    capturePosthog(c.env, "share_deck_delivered", normalized, {
      scenario_name: name,
      share_url: url,
      funnel_step: 10,
    }),
  );

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

app.get("/scenarios/:shortCode", async (c) => {
  const code = c.req.param("shortCode");
  let row: { payload: string } | null = null;
  try {
    row = await c.env.DB.prepare(
      "SELECT payload FROM scenarios WHERE short_code = ?",
    )
      .bind(code)
      .first<{ payload: string }>();
  } catch (err) {
    console.error("[scenarios] lookup failed", err);
    return c.json({ error: "storage_failed" }, 500);
  }
  if (!row) return c.json({ error: "not_found" }, 404);
  try {
    return c.json(JSON.parse(row.payload));
  } catch {
    return c.json({ error: "corrupt_payload" }, 500);
  }
});

app.post("/deck-assets", async (c) => {
  const contentType = c.req.header("content-type") ?? "";
  if (contentType !== "image/png") {
    return c.json({ error: "invalid_content_type" }, 415);
  }
  const lenHeader = c.req.header("content-length");
  const declared = lenHeader ? Number(lenHeader) : NaN;
  if (Number.isFinite(declared) && declared > MAX_ASSET_BYTES) {
    return c.json({ error: "asset_too_large" }, 413);
  }
  const buf = await c.req.arrayBuffer();
  if (buf.byteLength === 0) {
    return c.json({ error: "empty_body" }, 400);
  }
  if (buf.byteLength > MAX_ASSET_BYTES) {
    return c.json({ error: "asset_too_large" }, 413);
  }
  // PNG magic: 89 50 4E 47 0D 0A 1A 0A
  const head = new Uint8Array(buf, 0, Math.min(8, buf.byteLength));
  const isPng =
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47 &&
    head[4] === 0x0d &&
    head[5] === 0x0a &&
    head[6] === 0x1a &&
    head[7] === 0x0a;
  if (!isPng) {
    return c.json({ error: "not_png" }, 400);
  }
  const key = `${shortCode()}${shortCode()}.png`;
  try {
    await c.env.DECK_ASSETS.put(key, buf, {
      httpMetadata: { contentType: "image/png" },
    });
  } catch (err) {
    console.error("[deck-assets] put failed", err);
    return c.json({ error: "storage_failed" }, 500);
  }
  const origin = new URL(c.req.url).origin;
  return c.json({ url: `${origin}/deck-assets/${key}` });
});

app.get("/deck-assets/:key", async (c) => {
  const key = c.req.param("key");
  if (!/^[A-Za-z0-9]+\.png$/.test(key)) {
    return c.json({ error: "invalid_key" }, 400);
  }
  let obj: R2ObjectBody | null = null;
  try {
    obj = await c.env.DECK_ASSETS.get(key);
  } catch (err) {
    console.error("[deck-assets] get failed", err);
    return c.json({ error: "storage_failed" }, 500);
  }
  if (!obj) return c.json({ error: "not_found" }, 404);
  c.header("content-type", "image/png");
  c.header("cache-control", "public, max-age=31536000, immutable");
  return c.body(obj.body);
});

export default app satisfies ExportedHandler<Env>;
