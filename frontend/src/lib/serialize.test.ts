import { describe, expect, it } from "vitest";
import {
  decodeScenario,
  encodeScenario,
  scenarioToShareUrl,
  shareUrlToScenario,
} from "./serialize";
import type { Scenario } from "../types/scenario";

const sampleScenario: Scenario = {
  id: "test-scenario",
  name: "Seed Series A Plan",
  startingCash: 2_000_000,
  monthlyRevenue: 0,
  baselineBurn: 30_000,
  horizonMonths: 24,
  roles: [
    {
      id: "a",
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "SF",
      baseSalary: 230_000,
      benefitsMultiplier: 1.3,
      startMonth: 0,
    },
    {
      id: "b",
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "SF",
      baseSalary: 230_000,
      benefitsMultiplier: 1.3,
      startMonth: 0,
      endMonth: 12,
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("encode / decode", () => {
  it("roundtrips deeply", () => {
    const token = encodeScenario(sampleScenario);
    const decoded = decodeScenario(token);
    expect(decoded).toEqual(sampleScenario);
  });

  it("decodeScenario returns null on garbage input", () => {
    expect(decodeScenario("not-a-real-token!!!")).toBeNull();
    expect(decodeScenario("")).toBeNull();
  });

  it("decodeScenario returns null when payload is not a Scenario shape", () => {
    const token = encodeScenario({ hello: "world" } as unknown as Scenario);
    expect(decodeScenario(token)).toBeNull();
  });
});

describe("share URL", () => {
  it("builds a hash-fragment URL", () => {
    const url = scenarioToShareUrl(sampleScenario, "https://example.com");
    expect(url.startsWith("https://example.com/s#")).toBe(true);
  });

  it("strips trailing slash from base URL", () => {
    const url = scenarioToShareUrl(sampleScenario, "https://example.com/");
    expect(url.startsWith("https://example.com/s#")).toBe(true);
  });

  it("roundtrips through shareUrlToScenario", () => {
    const url = scenarioToShareUrl(sampleScenario, "https://example.com");
    expect(shareUrlToScenario(url)).toEqual(sampleScenario);
  });

  it("returns null for a URL without a hash", () => {
    expect(shareUrlToScenario("https://example.com/s")).toBeNull();
  });
});
