import { describe, expect, it } from "vitest";
import { buildLineupIndex, matchLineup } from "./lineupMatcher.js";

const dog = (id) => ({ _id: id });

const TEAMS = [
  {
    matchups: [
      { _id: "lineup1", dogs: [dog("d1"), dog("d2"), dog("d3"), dog("d4")] },
      { _id: "lineup2", dogs: [dog("d5"), dog("d6"), dog("d3"), dog("d4")] },
    ],
  },
];

describe("matchLineup", () => {
  it("matches a heat whose 4 dogs run in the exact same order as a registered lineup", () => {
    const index = buildLineupIndex(TEAMS);

    expect(matchLineup(["d1", "d2", "d3", "d4"], index)).toBe("lineup1");
  });

  it("does not match when the same 4 dogs run in a different order", () => {
    const index = buildLineupIndex(TEAMS);

    expect(matchLineup(["d2", "d1", "d3", "d4"], index)).toBeNull();
  });

  it("does not match when any dog is unmatched (null)", () => {
    const index = buildLineupIndex(TEAMS);

    expect(matchLineup(["d1", "d2", null, "d4"], index)).toBeNull();
  });

  it("does not match a lineup with fewer or more than 4 dogs", () => {
    const teams = [{ matchups: [{ _id: "lineup3", dogs: [dog("d1"), dog("d2"), dog("d3")] }] }];
    const index = buildLineupIndex(teams);

    expect(index.size).toBe(0);
  });

  it("returns null for a combination that matches no registered lineup", () => {
    const index = buildLineupIndex(TEAMS);

    expect(matchLineup(["x1", "x2", "x3", "x4"], index)).toBeNull();
  });
});
