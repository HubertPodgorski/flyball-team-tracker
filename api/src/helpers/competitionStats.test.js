import { describe, expect, it } from "vitest";
import { computeDogStats, computeStatsForAllDogs } from "./competitionStats.js";

const DOG = "dog1";

// One dog, at whatever position, with the given timing/time/fault - the other 3 slots are irrelevant filler.
const entryFor = (index, { timingValue, time, faulted = false }) => {
  const dogs = [{ matchedDogId: "filler" }, { matchedDogId: "filler" }, { matchedDogId: "filler" }, { matchedDogId: "filler" }];

  dogs[index] = { matchedDogId: DOG, [index === 0 ? "lightsTime" : "crossTime"]: timingValue, time, faulted };

  return { dogs };
};

describe("computeDogStats", () => {
  it("averages clean run time and clean numeric cross time, excluding faulted passes", () => {
    const entries = [
      entryFor(1, { timingValue: 0.1, time: 4.0 }),
      entryFor(1, { timingValue: 0.3, time: 4.4 }),
      entryFor(1, { timingValue: "early", time: 9.0, faulted: true }),
    ];
    const stats = computeDogStats(entries, DOG);

    expect(stats.totalPasses).toBe(3);
    expect(stats.faultCount).toBe(1);
    expect(stats.cleanCount).toBe(2);
    expect(stats.avgCrossTime).toBeCloseTo(0.2);
    expect(stats.avgRunTime).toBeCloseTo(4.2);
  });

  it("keeps 'ok' passes clean but out of the cross-time average, tracked as their own count", () => {
    const entries = [entryFor(2, { timingValue: 0.1, time: 4.0 }), entryFor(2, { timingValue: "ok", time: 4.1 }), entryFor(2, { timingValue: "OK", time: 4.2 })];
    const stats = computeDogStats(entries, DOG);

    expect(stats.faultCount).toBe(0);
    expect(stats.cleanCount).toBe(3);
    expect(stats.okCount).toBe(2);
    expect(stats.avgCrossTime).toBeCloseTo(0.1); // only the one numeric pass
    expect(stats.avgRunTime).toBeCloseTo((4.0 + 4.1 + 4.2) / 3); // "ok" passes still count toward run-time average
  });

  it("breaks okCount down by the exact ok text, for the outcome pie chart", () => {
    const entries = [
      entryFor(2, { timingValue: "ok", time: 4.0 }),
      entryFor(2, { timingValue: "ok", time: 4.1 }),
      entryFor(2, { timingValue: "OK", time: 4.2 }),
      entryFor(2, { timingValue: "Ok", time: 4.3 }),
    ];
    const stats = computeDogStats(entries, DOG);

    expect(stats.okByText).toEqual({ ok: 2, OK: 1, Ok: 1 });
  });

  it("reports both ok% denominators, faults included and faults excluded", () => {
    const entries = [
      entryFor(1, { timingValue: "ok", time: 4.0 }),
      entryFor(1, { timingValue: 0.2, time: 4.1 }),
      entryFor(1, { timingValue: "early", time: 9.0, faulted: true }),
    ];
    const stats = computeDogStats(entries, DOG);

    expect(stats.okPercentOfAllPasses).toBeCloseTo(1 / 3);
    expect(stats.okPercentOfCleanPasses).toBeCloseTo(1 / 2);
  });

  it("tracks lightsTime and crossTime as separate averages for the same dog", () => {
    const entries = [
      entryFor(0, { timingValue: 0.1, time: 4.0 }), // ran first (lights) in this heat
      entryFor(2, { timingValue: 0.5, time: 4.5 }), // ran third (cross) in this one
    ];
    const stats = computeDogStats(entries, DOG);

    expect(stats.avgLightsTime).toBeCloseTo(0.1);
    expect(stats.avgCrossTime).toBeCloseTo(0.5);
  });

  it("returns nulls, not NaN or 0, when a dog has no passes of a given kind", () => {
    const stats = computeDogStats([], DOG);

    expect(stats.totalPasses).toBe(0);
    expect(stats.faultRate).toBeNull();
    expect(stats.avgCrossTime).toBeNull();
    expect(stats.okPercentOfAllPasses).toBeNull();
  });

  it("computeStatsForAllDogs finds every distinct matched dog across the given entries", () => {
    const entries = [entryFor(1, { timingValue: 0.1, time: 4.0 }), { dogs: [{ matchedDogId: "dog2", crossTime: 0.2, time: 4.2, faulted: false }] }];
    const all = computeStatsForAllDogs(entries);

    expect(all.map((s) => s.dogId).sort()).toEqual(["dog2", "filler", DOG].sort());
  });

  // Regression: matchedDogId is a Mongoose ObjectId once loaded from the DB - two instances with the same value are still distinct objects, and a Set built without stringifying first treated the same dog's passes across heats as different dogs.
  it("merges a dog's passes across entries even when matchedDogId is a distinct object per entry with the same value", () => {
    const objectIdLike = (value) => ({ toString: () => value });
    const entries = [
      entryFor(1, { timingValue: 0.1, time: 4.0 }),
      entryFor(1, { timingValue: 0.3, time: 4.4 }),
    ].map((entry) => ({ dogs: entry.dogs.map((dog) => ({ ...dog, matchedDogId: dog.matchedDogId && objectIdLike(dog.matchedDogId) })) }));
    const all = computeStatsForAllDogs(entries);

    expect(all.filter((s) => s.dogId === DOG)).toHaveLength(1);
    expect(all.find((s) => s.dogId === DOG).totalPasses).toBe(2);
  });
});
