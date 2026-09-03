import { describe, expect, it } from "vitest";
import lineupCascade from "./lineupCascade.js";

const { keepOnlyPoolDogsInMatchups } = lineupCascade;

const crossPass = (overrides) => ({
  _id: "cp-1",
  dogId: "dog-a",
  runningOnLights: false,
  runningOnDog: { _id: "dog-b" },
  note: "",
  startingPosition: "16m",
  time: 2.1,
  ...overrides,
});

const lineup = (dogs, crossPasses) => ({ _id: "lineup-1", dogs, crossPasses });

describe("keepOnlyPoolDogsInMatchups", () => {
  it("leaves a lineup untouched when every dog it uses is still allowed", () => {
    const matchups = [lineup([{ _id: "dog-a" }, { _id: "dog-b" }], [crossPass({})])];

    const [result] = keepOnlyPoolDogsInMatchups(matchups, new Set(["dog-a", "dog-b"]));

    expect(result.dogs).toEqual([{ _id: "dog-a" }, { _id: "dog-b" }]);
    expect(result.crossPasses).toEqual([crossPass({})]);
  });

  it("removes a disallowed dog from every lineup's roster", () => {
    const matchups = [lineup([{ _id: "dog-a" }, { _id: "dog-b" }], [])];

    const [result] = keepOnlyPoolDogsInMatchups(matchups, new Set(["dog-b"]));

    expect(result.dogs).toEqual([{ _id: "dog-b" }]);
  });

  it("deletes a cross pass owned by a disallowed dog", () => {
    const matchups = [lineup([], [crossPass({ dogId: "dog-a" })])];

    const [result] = keepOnlyPoolDogsInMatchups(matchups, new Set());

    expect(result.crossPasses).toEqual([]);
  });

  it("clears (not deletes) a cross pass whose predecessor is disallowed", () => {
    const matchups = [
      lineup([], [crossPass({ dogId: "dog-c", runningOnDog: { _id: "dog-a" } })]),
    ];

    const [result] = keepOnlyPoolDogsInMatchups(matchups, new Set(["dog-c"]));

    expect(result.crossPasses).toHaveLength(1);
    expect(result.crossPasses[0].runningOnDog).toBeUndefined();
    expect(result.crossPasses[0].dogId).toBe("dog-c");
  });

  it("leaves cross passes untouched when both dogs are allowed", () => {
    const untouched = crossPass({ dogId: "dog-z", runningOnDog: { _id: "dog-y" } });
    const matchups = [lineup([], [untouched])];

    const [result] = keepOnlyPoolDogsInMatchups(matchups, new Set(["dog-z", "dog-y"]));

    expect(result.crossPasses[0]).toEqual(untouched);
  });

  it("leaves a running-on-lights cross pass untouched regardless of allowed ids", () => {
    const lights = crossPass({ dogId: "dog-a", runningOnLights: true, runningOnDog: undefined });
    const matchups = [lineup([], [lights])];

    const [result] = keepOnlyPoolDogsInMatchups(matchups, new Set(["dog-a"]));

    expect(result.crossPasses[0]).toEqual(lights);
  });

  it("handles multiple disallowed dogs across multiple lineups", () => {
    const matchups = [
      lineup(
        [{ _id: "dog-a" }, { _id: "dog-b" }, { _id: "dog-c" }],
        [
          crossPass({ dogId: "dog-a" }),
          crossPass({ dogId: "dog-c", runningOnDog: { _id: "dog-b" } }),
        ]
      ),
      lineup([{ _id: "dog-a" }], []),
    ];

    const [first, second] = keepOnlyPoolDogsInMatchups(matchups, new Set(["dog-c"]));

    expect(first.dogs).toEqual([{ _id: "dog-c" }]);
    expect(first.crossPasses).toHaveLength(1);
    expect(first.crossPasses[0].dogId).toBe("dog-c");
    expect(first.crossPasses[0].runningOnDog).toBeUndefined();
    expect(second.dogs).toEqual([]);
  });

  it("is self-correcting regardless of what a caller thinks it removed - the key regression this replaces", () => {
    // This is the scenario that broke in production: two overlapping saves,
    // the second built from a stale snapshot that still includes a dog the
    // first save already removed. Keying off `allowedDogIds` (derived fresh
    // from each request's own `dogs` payload) means the second save is
    // still correct even though it "doesn't know" about the first one.
    const staleMatchups = [
      lineup([{ _id: "dog-a" }, { _id: "dog-b" }], [crossPass({ dogId: "dog-a" })]),
    ];

    // The stale request's own `dogs` payload never included dog-a either -
    // it was removed from the pool before this request was even built.
    const [result] = keepOnlyPoolDogsInMatchups(staleMatchups, new Set(["dog-b"]));

    expect(result.dogs).toEqual([{ _id: "dog-b" }]);
    expect(result.crossPasses).toEqual([]);
  });
});
