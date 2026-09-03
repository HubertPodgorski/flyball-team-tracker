import { describe, expect, it } from "vitest";
import crossPassSync from "./crossPassSync.js";

const {
  getRunningOnKey,
  findChangedSyncedCrossPasses,
  applyCrossPassSyncToTeams,
  buildMyDogsSyncOps,
} = crossPassSync;

describe("getRunningOnKey", () => {
  it("returns 'LIGHTS' for a cross pass running on lights", () => {
    expect(getRunningOnKey({ runningOnLights: true, runningOnDog: undefined })).toBe(
      "LIGHTS"
    );
  });

  it("returns the predecessor dog's id when not running on lights", () => {
    expect(
      getRunningOnKey({ runningOnLights: false, runningOnDog: { _id: "dog-1" } })
    ).toBe("dog-1");
  });

  it("returns undefined when neither lights nor a predecessor dog is set", () => {
    expect(getRunningOnKey({ runningOnLights: false, runningOnDog: undefined })).toBeUndefined();
  });
});

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

const lineup = (crossPasses, dogs) => ({ dogs, crossPasses });

const dog = (id, flags) => ({ _id: id, name: id, ...flags });

describe("findChangedSyncedCrossPasses", () => {
  it("ignores an entry that hasn't changed", () => {
    const cp = crossPass({});
    const existingTeam = {
      matchups: [lineup([cp], [dog("dog-a", { syncCrossPasses: true })])],
    };
    const newMatchups = [
      lineup([crossPass({})], [dog("dog-a", { syncCrossPasses: true })]),
    ];

    expect(findChangedSyncedCrossPasses(existingTeam, newMatchups)).toEqual([]);
  });

  it("ignores a changed entry when both sync flags are off", () => {
    const existingTeam = {
      matchups: [lineup([crossPass({})], [dog("dog-a", {})])],
    };
    const newMatchups = [lineup([crossPass({ time: 2.5 })], [dog("dog-a", {})])];

    expect(findChangedSyncedCrossPasses(existingTeam, newMatchups)).toEqual([]);
  });

  it("reports a changed entry with syncLineups true when syncCrossPasses is on", () => {
    const existingTeam = {
      matchups: [lineup([crossPass({})], [dog("dog-a", { syncCrossPasses: true })])],
    };
    const newMatchups = [
      lineup(
        [crossPass({ time: 2.5, note: "faster" })],
        [dog("dog-a", { syncCrossPasses: true })]
      ),
    ];

    expect(findChangedSyncedCrossPasses(existingTeam, newMatchups)).toEqual([
      {
        dogId: "dog-a",
        runningOnKey: "dog-b",
        runningOnLights: false,
        runningOnDog: { _id: "dog-b" },
        note: "faster",
        startingPosition: "16m",
        time: 2.5,
        syncLineups: true,
        syncMyDogs: false,
      },
    ]);
  });

  it("reports a changed entry with syncMyDogs true when syncCrossPassesWithMyDogs is on", () => {
    const existingTeam = {
      matchups: [
        lineup([crossPass({})], [dog("dog-a", { syncCrossPassesWithMyDogs: true })]),
      ],
    };
    const newMatchups = [
      lineup(
        [crossPass({ time: 3 })],
        [dog("dog-a", { syncCrossPassesWithMyDogs: true })]
      ),
    ];

    const [changed] = findChangedSyncedCrossPasses(existingTeam, newMatchups);

    expect(changed.syncLineups).toBe(false);
    expect(changed.syncMyDogs).toBe(true);
  });

  it("sets both flags true when a dog has both sync options on", () => {
    const existingTeam = {
      matchups: [
        lineup(
          [crossPass({})],
          [dog("dog-a", { syncCrossPasses: true, syncCrossPassesWithMyDogs: true })]
        ),
      ],
    };
    const newMatchups = [
      lineup(
        [crossPass({ time: 3 })],
        [dog("dog-a", { syncCrossPasses: true, syncCrossPassesWithMyDogs: true })]
      ),
    ];

    const [changed] = findChangedSyncedCrossPasses(existingTeam, newMatchups);

    expect(changed.syncLineups).toBe(true);
    expect(changed.syncMyDogs).toBe(true);
  });

  it("reports a brand-new entry (no matching id in the existing team)", () => {
    const existingTeam = {
      matchups: [lineup([], [dog("dog-a", { syncCrossPasses: true })])],
    };
    const newMatchups = [
      lineup([crossPass({ _id: "cp-new" })], [dog("dog-a", { syncCrossPasses: true })]),
    ];

    const [changed] = findChangedSyncedCrossPasses(existingTeam, newMatchups);

    expect(changed.dogId).toBe("dog-a");
    expect(changed.runningOnKey).toBe("dog-b");
    expect(changed.note).toBe("");
    expect(changed.time).toBe(2.1);
  });

  it("only flags fields that actually differ - a note-only change still reports the full entry", () => {
    const existingTeam = {
      matchups: [lineup([crossPass({})], [dog("dog-a", { syncCrossPasses: true })])],
    };
    const newMatchups = [
      lineup([crossPass({ note: "new note" })], [dog("dog-a", { syncCrossPasses: true })]),
    ];

    const [changed] = findChangedSyncedCrossPasses(existingTeam, newMatchups);

    expect(changed.note).toBe("new note");
    expect(changed.time).toBe(2.1);
  });
});

const team = (id, matchups) => ({ _id: id, matchups });

const entry = (overrides) => ({
  dogId: "dog-a",
  runningOnKey: "dog-b",
  runningOnLights: false,
  runningOnDog: { _id: "dog-b" },
  note: "faster",
  startingPosition: "16m",
  time: 2.5,
  syncLineups: true,
  syncMyDogs: false,
  ...overrides,
});

describe("applyCrossPassSyncToTeams", () => {
  it("returns no updates when no team has a matching cross pass", () => {
    const teams = [team("team-1", [lineup([crossPass({ dogId: "dog-z" })], [])])];

    const result = applyCrossPassSyncToTeams(teams, [entry({})]);

    expect(result).toEqual({ teamUpdates: [], anyChanged: false });
  });

  it("skips a matching cross pass whose values already match the entry", () => {
    const teams = [team("team-1", [lineup([crossPass({})], [])])];
    const alreadyInSync = entry({ note: "", startingPosition: "16m", time: 2.1 });

    const result = applyCrossPassSyncToTeams(teams, [alreadyInSync]);

    expect(result.anyChanged).toBe(false);
    expect(result.teamUpdates).toEqual([]);
  });

  it("builds an update for a team with a matching, differing cross pass", () => {
    const teams = [team("team-1", [lineup([crossPass({})], [])])];

    const result = applyCrossPassSyncToTeams(teams, [entry({})]);

    expect(result.anyChanged).toBe(true);
    expect(result.teamUpdates).toHaveLength(1);

    const [update] = result.teamUpdates;

    expect(update.updateOne.filter).toEqual({ _id: "team-1" });
    expect(update.updateOne.update.matchups[0].crossPasses[0]).toMatchObject({
      note: "faster",
      startingPosition: "16m",
      time: 2.5,
      // Pairing itself is untouched by the sync.
      dogId: "dog-a",
      runningOnDog: { _id: "dog-b" },
    });
  });

  it("only includes teams that actually changed, out of several", () => {
    const teams = [
      team("team-1", [lineup([crossPass({ dogId: "dog-z" })], [])]),
      team("team-2", [lineup([crossPass({})], [])]),
    ];

    const result = applyCrossPassSyncToTeams(teams, [entry({})]);

    expect(result.teamUpdates).toHaveLength(1);
    expect(result.teamUpdates[0].updateOne.filter).toEqual({ _id: "team-2" });
  });
});

describe("buildMyDogsSyncOps", () => {
  it("skips entries with syncMyDogs off", () => {
    expect(buildMyDogsSyncOps("CLUB", [entry({ syncMyDogs: false })])).toEqual([]);
  });

  it("builds an upsert filtered by predecessor dog when not on lights", () => {
    const [op] = buildMyDogsSyncOps("CLUB", [entry({ syncMyDogs: true })]);

    expect(op.updateOne.filter).toEqual({
      team: "CLUB",
      dogId: "dog-a",
      "runningOnDog._id": "dog-b",
    });
    expect(op.updateOne.update.$set).toMatchObject({
      note: "faster",
      startingPosition: "16m",
      time: 2.5,
      runningOnDog: { _id: "dog-b" },
    });
    expect(op.updateOne.upsert).toBe(true);
  });

  it("builds an upsert filtered by runningOnLights, dropping runningOnDog", () => {
    const [op] = buildMyDogsSyncOps("CLUB", [
      entry({ syncMyDogs: true, runningOnLights: true, runningOnKey: "LIGHTS" }),
    ]);

    expect(op.updateOne.filter).toEqual({
      team: "CLUB",
      dogId: "dog-a",
      runningOnLights: true,
    });
    expect(op.updateOne.update.$set.runningOnDog).toBeUndefined();
  });
});
