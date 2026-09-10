import { describe, expect, it } from "vitest";
import { aggregateLineupRow, aggregateClubRow } from "./competitionLineupStats";
import { CompetitionDogStats, CompetitionLineup } from "./types";

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

const lineup: CompetitionLineup = { key: "Rex|Milo", order: "Rex → Milo", heatCount: 4 };

describe("aggregateLineupRow", () => {
  it("labels the row by the running order, keyed on the lineup key", () => {
    const row = aggregateLineupRow(lineup, []);

    expect(row.dogId).toBe("Rex|Milo");
    expect(row.name).toBe("Rex → Milo");
    expect(row.nameSubLabel).toBeNull();
  });

  it("sums raw counts across the lineup's dogs, then rebuilds rates from those sums", () => {
    const row = aggregateLineupRow(lineup, [
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
    const row = aggregateLineupRow(lineup, []);

    expect(row.totalPasses).toBe(0);
    expect(row.faultRate).toBeNull();
    expect(row.okPercentOfAllPasses).toBeNull();
    expect(row.okPercentOfCleanPasses).toBeNull();
  });
});

describe("aggregateClubRow", () => {
  const dogs = [
    dogStats({ dogId: "Rex", name: "Rex", teamName: "Club B", totalPasses: 10, faultCount: 2, okCount: 3, okByText: { ok: 3 } }),
    dogStats({ dogId: "Milo", name: "Milo", teamName: "Club B", totalPasses: 6, faultCount: 0, okCount: 6, okByText: { OK: 6 } }),
    dogStats({ dogId: "Spot", name: "Spot", teamName: "Club C", totalPasses: 4, faultCount: 4, okCount: 0 }),
  ];

  it("keeps only the given club's dogs and labels the row by the club name", () => {
    const row = aggregateClubRow("Club B", dogs);

    expect(row.dogId).toBe("Club B");
    expect(row.name).toBe("Club B");
    expect(row.totalPasses).toBe(16);
    expect(row.faultCount).toBe(2);
    expect(row.okCount).toBe(9);
    expect(row.okByText).toEqual({ ok: 3, OK: 6 });
    expect(row.faultRate).toBeCloseTo(2 / 16);
  });

  it("is empty when the club ran no dogs", () => {
    const row = aggregateClubRow("Club Z", dogs);

    expect(row.totalPasses).toBe(0);
    expect(row.faultRate).toBeNull();
  });
});
