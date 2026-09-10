import { describe, expect, it } from "vitest";
import { ALL_FEATURES_ON, FEATURE_KEYS } from "./clubFeatures";
import { ClubFeatures } from "./types";

// A full value of the type - add a key to ClubFeatures and TS forces it here, which then trips the tests below
// if FEATURE_KEYS wasn't updated too.
const sample: ClubFeatures = {
  teamsAndLineups: true,
  crossPasses: true,
  netTime: true,
  eventsCalendar: true,
  ejsStats: true,
  dogTasksCatalog: true,
  usefulResources: true,
};

describe("clubFeatures", () => {
  it("FEATURE_KEYS covers every ClubFeatures flag", () => {
    expect([...FEATURE_KEYS].sort()).toEqual(Object.keys(sample).sort());
  });

  it("ALL_FEATURES_ON turns on every flag", () => {
    expect(ALL_FEATURES_ON).toEqual(
      Object.fromEntries(Object.keys(sample).map((key) => [key, true]))
    );
  });
});
