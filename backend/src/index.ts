import { Hono } from "hono";
import { cors } from "hono/cors";
import { customAlphabet } from "nanoid";

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
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["content-type"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

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
