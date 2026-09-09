import { describe, expect, it } from "vitest";
import { aggregateLineupRow } from "./competitionLineupStats";
import { CompetitionDogStats, Lineup } from "./types";

// Only the fields aggregateLineupRow reads actually matter for these tests.
const dogStats = (overrides: Partial<CompetitionDogStats>): CompetitionDogStats => ({
  dogId: "dog",
  name: "Dog",
  totalPasses: 0,
  faultCount: 0,
  faultRate: null,
  cleanCount: 0,
  okCount: 0,
  okByText: {},
  okPercentOfAllPasses: null,
  okPercentOfCleanPasses: null,
  avgCrossTime: null,
  avgLightsTime: null,
  avgRunTime: null,
  ...overrides,
});

const lineup = (overrides: Partial<Lineup>): Lineup => ({
  _id: "lineup-1",
  dogs: [{ _id: "a", name: "Rex" }, { _id: "b", name: "Milo" }],
  crossPasses: [],
  ...overrides,
});

describe("aggregateLineupRow", () => {
  it("shows the dog order as a separate sub-label when the lineup has its own name", () => {
    const row = aggregateLineupRow(lineup({ name: "Alpha Squad" }), []);

    expect(row.name).toBe("Alpha Squad");
    expect(row.nameSubLabel).toBe("Rex → Milo");
  });

  it("falls back to the dog order as the name itself, with no redundant sub-label, when unnamed", () => {
    const row = aggregateLineupRow(lineup({ name: undefined }), []);

    expect(row.name).toBe("Rex → Milo");
    expect(row.nameSubLabel).toBeNull();
  });

  it("sums raw counts across the lineup's dogs, then rebuilds rates from those sums", () => {
    const row = aggregateLineupRow(lineup({ name: "Alpha Squad" }), [
      dogStats({ totalPasses: 10, faultCount: 2, okCount: 3 }),
      dogStats({ totalPasses: 6, faultCount: 0, okCount: 6 }),
    ]);

    expect(row.totalPasses).toBe(16);
    expect(row.faultCount).toBe(2);
    expect(row.okCount).toBe(9);
    expect(row.cleanCount).toBe(14); // 16 - 2 faulted
    expect(row.faultRate).toBeCloseTo(2 / 16);
    expect(row.okPercentOfAllPasses).toBeCloseTo(9 / 16);
    expect(row.okPercentOfCleanPasses).toBeCloseTo(9 / 14);
  });

  it("returns nulls rather than dividing by zero when the lineup has no passes yet", () => {
    const row = aggregateLineupRow(lineup({ name: "Alpha Squad" }), []);

    expect(row.totalPasses).toBe(0);
    expect(row.faultRate).toBeNull();
    expect(row.okPercentOfAllPasses).toBeNull();
    expect(row.okPercentOfCleanPasses).toBeNull();
  });
});
