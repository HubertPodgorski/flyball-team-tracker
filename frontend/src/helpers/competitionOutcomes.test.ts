import { describe, expect, it } from "vitest";
import { aggregateOutcomes } from "./competitionOutcomes";
import { CompetitionDogStats } from "./types";

// Only the fields aggregateOutcomes reads actually matter for these tests.
const dog = (overrides: Partial<CompetitionDogStats>): CompetitionDogStats => ({
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

describe("aggregateOutcomes", () => {
  it("splits one dog's passes into fault / ok-by-text / clean-rest", () => {
    const totals = aggregateOutcomes([dog({ totalPasses: 10, faultCount: 2, okByText: { ok: 3, OK: 1 } })]);

    expect(totals.totalPasses).toBe(10);
    expect(totals.faultCount).toBe(2);
    expect(totals.okCount).toBe(4);
    expect(totals.cleanRestCount).toBe(4); // 10 - 2 faulted - 4 ok
    expect(totals.okByText).toEqual({ ok: 3, OK: 1 });
  });

  it("sums across every dog given, merging their ok-text counts", () => {
    const totals = aggregateOutcomes([
      dog({ totalPasses: 5, faultCount: 1, okByText: { ok: 2 } }),
      dog({ totalPasses: 3, faultCount: 0, okByText: { ok: 1, Ok: 1 } }),
    ]);

    expect(totals.totalPasses).toBe(8);
    expect(totals.faultCount).toBe(1);
    expect(totals.okByText).toEqual({ ok: 3, Ok: 1 });
    expect(totals.cleanRestCount).toBe(3); // 8 - 1 fault - 4 ok
  });

  it("returns all zeros for an empty dog list, not NaN", () => {
    const totals = aggregateOutcomes([]);

    expect(totals).toEqual({ totalPasses: 0, faultCount: 0, okCount: 0, cleanRestCount: 0, okByText: {} });
  });
});
