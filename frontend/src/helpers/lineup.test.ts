import { describe, expect, it } from "vitest";
import { getLineupJumpHeight, formatLineupLabel } from "./lineup";
import { Dog, Lineup } from "./types";

const dog = (overrides: Partial<Dog>): Dog => ({
  _id: "dog-id",
  name: "Dog",
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
