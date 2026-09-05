import { describe, expect, it } from "vitest";
import clubFeatures from "./clubFeatures.js";

const { DEFAULT_FEATURES, normalizeFeatures } = clubFeatures;

describe("normalizeFeatures", () => {
  it("fills in any missing key with its default", () => {
    expect(normalizeFeatures({})).toEqual(DEFAULT_FEATURES);
  });

  it("turning teamsAndLineups off forces crossPasses off too", () => {
    const result = normalizeFeatures({ teamsAndLineups: false, crossPasses: true });

    expect(result.teamsAndLineups).toBe(false);
    expect(result.crossPasses).toBe(false);
  });

  it("leaves crossPasses alone when teamsAndLineups stays on", () => {
    const result = normalizeFeatures({ teamsAndLineups: true, crossPasses: false });

    expect(result.crossPasses).toBe(false);
  });

  it("does not cascade the other direction - crossPasses off leaves lineups on", () => {
    const result = normalizeFeatures({ crossPasses: false });

    expect(result.teamsAndLineups).toBe(true);
  });
});
