import { describe, expect, it } from "vitest";
import { getLineupJumpHeight, formatLineupLabel, getLineupNetTime } from "./lineup";
import { Dog, Lineup, LineupCrossPass } from "./types";

const dog = (overrides: Partial<Dog>): Dog => ({
  _id: "dog-id",
  name: "Dog",
  ...overrides,
});

const crossPass = (overrides: Partial<LineupCrossPass>): LineupCrossPass => ({
  _id: "cross-pass-id",
  dogId: "dog-id",
  ...overrides,
});

describe("getLineupJumpHeight", () => {
  it("returns undefined for an empty lineup", () => {
    expect(getLineupJumpHeight([])).toBeUndefined();
  });

  it("returns the lowest jump height across the lineup's dogs", () => {
    const dogs = [dog({ jumpHeight: 30 }), dog({ jumpHeight: 25 }), dog({ jumpHeight: 35 })];

    expect(getLineupJumpHeight(dogs)).toBe(25);
  });

  it("defaults a dog with no set jump height to 35cm", () => {
    const dogs = [dog({ jumpHeight: undefined }), dog({ jumpHeight: 30 })];

    expect(getLineupJumpHeight(dogs)).toBe(30);
  });

  it("falls back to 35cm when no dog has a jump height set", () => {
    const dogs = [dog({}), dog({})];

    expect(getLineupJumpHeight(dogs)).toBe(35);
  });
});

describe("formatLineupLabel", () => {
  const baseLineup: Lineup = { _id: "lineup-id", dogs: [], crossPasses: [] };

  it("uses the fallback name when the lineup has no name", () => {
    expect(formatLineupLabel({ ...baseLineup, name: undefined }, "Lineup")).toBe("Lineup");
  });

  it("uses the lineup's own name when set", () => {
    expect(formatLineupLabel({ ...baseLineup, name: "Super lineup" }, "Lineup")).toBe(
      "Super lineup"
    );
  });

  it("appends the jump height in brackets when the lineup has dogs", () => {
    const lineup = { ...baseLineup, name: "Super lineup", dogs: [dog({ jumpHeight: 25 })] };

    expect(formatLineupLabel(lineup, "Lineup")).toBe("Super lineup (25cm)");
  });

  it("omits the bracket entirely for a dog-less lineup", () => {
    expect(formatLineupLabel({ ...baseLineup, name: "Empty" }, "Lineup")).toBe("Empty");
  });
});

describe("getLineupNetTime", () => {
  it("returns undefined when not a single dog has a time recorded", () => {
    const crossPasses = [crossPass({ time: undefined }), crossPass({ time: undefined })];

    expect(getLineupNetTime(crossPasses)).toBeUndefined();
  });

  it("sums every dog's own time - not adjusted for cross-pass overlap", () => {
    const crossPasses = [
      crossPass({ time: 4.85 }),
      crossPass({ time: 4.62 }),
      crossPass({ time: 4.7 }),
      crossPass({ time: 4.55 }),
    ];

    expect(getLineupNetTime(crossPasses)).toBe(18.72);
  });

  it("sums only the dogs that have a time recorded, ignoring the rest", () => {
    const crossPasses = [crossPass({ time: 4.5 }), crossPass({ time: undefined })];

    expect(getLineupNetTime(crossPasses)).toBe(4.5);
  });

  it("rounds away floating-point noise from summing decimals", () => {
    const crossPasses = [crossPass({ time: 0.1 }), crossPass({ time: 0.2 })];

    expect(getLineupNetTime(crossPasses)).toBe(0.3);
  });
});
