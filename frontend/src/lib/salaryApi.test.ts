import { describe, expect, it } from "vitest";
import {
  findFamily,
  findFamilyByTitle,
  getSalaryRange,
  pickPercentile,
  type SalaryCatalog,
} from "./salaryApi";

const CATALOG: SalaryCatalog = {
  families: [
    {
      key: "software-engineer",
      displayName: "Software Engineer",
      team: "Engineering",
      compType: "base",
      aliases: ["Backend Engineer", "Frontend Engineer"],
      levels: {
        IC: { p25: 150_000, p50: 170_000, p75: 195_000 },
        Senior: { p25: 190_000, p50: 220_000, p75: 255_000 },
      },
    },
    {
      key: "sdr",
      displayName: "SDR / BDR",
      team: "GTM",
      compType: "ote",
      aliases: ["SDR"],
      levels: { IC: { p25: 90_000, p50: 115_000, p75: 140_000 } },
      note: "OTE with variable component.",
    },
  ],
  locations: {
    SF: 1.0,
    NYC: 1.0,
    Seattle: 0.95,
    "Remote US": 0.88,
    Europe: 0.7,
    LATAM: 0.5,
  },
  levels: ["IC", "Senior", "Staff", "Manager"],
  sources: [],
  sourceStage: "test",
};

describe("findFamily", () => {
  it("looks up by key", () => {
    expect(findFamily(CATALOG, "software-engineer")?.displayName).toBe(
      "Software Engineer",
    );
  });

  it("returns undefined for unknown keys", () => {
    expect(findFamily(CATALOG, "astronaut")).toBeUndefined();
  });
});

describe("findFamilyByTitle", () => {
  it("matches display name case-insensitively", () => {
    expect(findFamilyByTitle(CATALOG, "software engineer")?.key).toBe(
      "software-engineer",
    );
  });

  it("matches aliases", () => {
    expect(findFamilyByTitle(CATALOG, "Backend Engineer")?.key).toBe(
      "software-engineer",
    );
  });

  it("returns undefined on miss", () => {
    expect(findFamilyByTitle(CATALOG, "Astronaut")).toBeUndefined();
  });
});

describe("getSalaryRange", () => {
  it("returns SF p50 at the baseline multiplier", () => {
    const r = getSalaryRange(CATALOG, "software-engineer", "Senior", "SF");
    expect(r?.range).toEqual({ p25: 190_000, p50: 220_000, p75: 255_000 });
    expect(r?.compType).toBe("base");
  });

  it("applies the LATAM multiplier and rounds to 1K", () => {
    const r = getSalaryRange(CATALOG, "software-engineer", "Senior", "LATAM");
    expect(r?.range).toEqual({ p25: 95_000, p50: 110_000, p75: 128_000 });
    expect(r?.multiplier).toBe(0.5);
  });

  it("surfaces the OTE note for GTM roles", () => {
    const r = getSalaryRange(CATALOG, "sdr", "IC", "NYC");
    expect(r?.compType).toBe("ote");
    expect(r?.note).toBe("OTE with variable component.");
  });

  it("returns undefined for unknown role", () => {
    expect(
      getSalaryRange(CATALOG, "astronaut", "Senior", "SF"),
    ).toBeUndefined();
  });

  it("returns undefined when the family has no band for the level", () => {
    expect(getSalaryRange(CATALOG, "sdr", "Staff", "SF")).toBeUndefined();
  });
});

describe("pickPercentile", () => {
  it("defaults to p50", () => {
    expect(
      pickPercentile({ p25: 100, p50: 150, p75: 200 }),
    ).toBe(150);
  });

  it("picks the requested percentile", () => {
    expect(
      pickPercentile({ p25: 100, p50: 150, p75: 200 }, "p75"),
    ).toBe(200);
  });
});
