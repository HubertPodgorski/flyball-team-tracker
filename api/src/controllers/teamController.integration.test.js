import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import teamControllerModule from "./teamController.js";
import testHelpersModule from "../testHelpers.js";

// Importing the controller (a CJS module) is what registers the Mongoose
// models via its own internal require()s - looking them up afterwards by
// name (rather than separately import()ing the model files directly) avoids
// Mongoose's "Cannot overwrite model once compiled" error, since vitest's
// CJS/ESM interop can otherwise load the same schema file twice.
const { getTeams, createTeam, updateTeam, deleteTeam } = teamControllerModule;
const TeamModel = mongoose.model("Team");
const TaskModel = mongoose.model("Task");
const DogModel = mongoose.model("Dog");
const { mockRes } = testHelpersModule;

const CLUB = "TEST_TEAM";

describe("getTeams", () => {
  it("only returns teams for the caller's club", async () => {
    await TeamModel.create({ name: "Mine", team: CLUB, dogs: [], matchups: [] });
    await TeamModel.create({ name: "Theirs", team: "OTHER_CLUB", dogs: [], matchups: [] });

    const res = mockRes();

    await getTeams({ club: CLUB }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Mine");
  });
});

describe("createTeam", () => {
  it("creates a team scoped to the caller's club", async () => {
    const res = mockRes();

    await createTeam({ club: CLUB, body: { name: "New team", dogs: [], matchups: [] } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.team).toBe(CLUB);

    const stored = await TeamModel.findById(res.body._id);

    expect(stored.name).toBe("New team");
  });
});

describe("updateTeam", () => {
  it("404s for a team that doesn't belong to the caller's club", async () => {
    const team = await TeamModel.create({ name: "Theirs", team: "OTHER_CLUB", dogs: [], matchups: [] });
    const res = mockRes();

    await updateTeam({ club: CLUB, body: { _id: team._id.toString(), name: "Hijacked" } }, res);

    expect(res.statusCode).toBe(404);
  });

  it("renames a team", async () => {
    const team = await TeamModel.create({ name: "Old name", team: CLUB, dogs: [], matchups: [] });
    const res = mockRes();

    await updateTeam({ club: CLUB, body: { _id: team._id.toString(), name: "New name" } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("New name");
  });

  // The exact production incident: removing a dog from the pool must scrub
  // it out of every lineup and cross-pass in the same team, even though the
  // request only touched `dogs`.
  it("removes a dog dropped from the pool out of every lineup and its cross-passes", async () => {
    const [dogA, dogB] = await Promise.all([
      DogModel.create({ name: "Api", team: CLUB }),
      DogModel.create({ name: "Enter", team: CLUB }),
    ]);

    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [dogA.toObject(), dogB.toObject()],
      matchups: [
        {
          name: "Lineup 1",
          dogs: [dogA.toObject(), dogB.toObject()],
          crossPasses: [
            { dogId: dogA._id, runningOnLights: true, note: "on lights" },
            { dogId: dogB._id, runningOnDog: dogA.toObject(), note: "behind Api" },
          ],
        },
      ],
    });

    const res = mockRes();

    await updateTeam(
      {
        club: CLUB,
        body: {
          _id: team._id.toString(),
          dogs: [dogB.toObject()], // Api dropped from the pool
          matchups: team.matchups.map((lineup) => lineup.toObject()),
        },
      },
      res
    );

    expect(res.statusCode).toBe(200);

    const stored = await TeamModel.findById(team._id);
    const lineup = stored.matchups[0];

    expect(lineup.dogs.map((dog) => dog.name)).toEqual(["Enter"]);
    // Api's own leg (running on lights) is gone entirely.
    expect(lineup.crossPasses).toHaveLength(1);
    // Enter's leg survives, but its predecessor (Api) reference is cleared.
    expect(lineup.crossPasses[0].dogId.toString()).toBe(dogB._id.toString());
    expect(lineup.crossPasses[0].runningOnDog).toBeUndefined();
  });

  it("is self-correcting even against a stale payload that still lists an already-removed dog", async () => {
    // Simulates the double-submit race: a second request built before the
    // first one's response updated the client, so its `matchups` payload
    // still includes a dog its own `dogs` payload has already dropped.
    const dog = await DogModel.create({ name: "Api", team: CLUB });

    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [dog.toObject()],
      matchups: [
        { name: "Lineup 1", dogs: [dog.toObject()], crossPasses: [] },
      ],
    });

    const res = mockRes();

    await updateTeam(
      {
        club: CLUB,
        body: {
          _id: team._id.toString(),
          dogs: [], // already empty
          matchups: [{ name: "Lineup 1", dogs: [dog.toObject()], crossPasses: [] }], // stale
        },
      },
      res
    );

    expect(res.statusCode).toBe(200);

    const stored = await TeamModel.findById(team._id);

    expect(stored.matchups[0].dogs).toEqual([]);
  });

  it("detaches tasks linked to a lineup that was removed from matchups", async () => {
    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [],
      matchups: [{ name: "Lineup 1", dogs: [], crossPasses: [] }],
    });
    const lineupId = team.matchups[0]._id;

    const task = await TaskModel.create({
      team: CLUB,
      description: "Linked task",
      dogs: [],
      position: { columnIndex: 0, rowIndex: 0, positionIndex: 0 },
      matchupRef: { squadId: team._id, matchupId: lineupId },
    });

    const res = mockRes();

    await updateTeam(
      { club: CLUB, body: { _id: team._id.toString(), dogs: [], matchups: [] } },
      res
    );

    expect(res.statusCode).toBe(200);

    const storedTask = await TaskModel.findById(task._id);

    expect(storedTask.toJSON().matchupRef).toBeUndefined();
  });

  it("propagates synced cross-pass timing to every other lineup for a dog with syncCrossPasses on", async () => {
    const runner = await DogModel.create({ name: "Runner", team: CLUB, syncCrossPasses: true });
    const predecessor = await DogModel.create({ name: "Predecessor", team: CLUB });

    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [runner.toObject(), predecessor.toObject()],
      matchups: [
        {
          name: "Lineup A",
          dogs: [runner.toObject(), predecessor.toObject()],
          crossPasses: [
            { dogId: runner._id, runningOnDog: predecessor.toObject(), note: "old", time: 1 },
          ],
        },
        {
          name: "Lineup B",
          dogs: [runner.toObject(), predecessor.toObject()],
          crossPasses: [
            { dogId: runner._id, runningOnDog: predecessor.toObject(), note: "old", time: 1 },
          ],
        },
      ],
    });

    const [lineupA, lineupB] = team.matchups.map((lineup) => lineup.toObject());

    lineupA.crossPasses[0].note = "updated";
    lineupA.crossPasses[0].time = 2.5;

    const res = mockRes();

    await updateTeam(
      {
        club: CLUB,
        body: { _id: team._id.toString(), matchups: [lineupA, lineupB] },
      },
      res
    );

    expect(res.statusCode).toBe(200);

    const stored = await TeamModel.findById(team._id);
    const [storedA, storedB] = stored.matchups;

    expect(storedA.crossPasses[0].note).toBe("updated");
    expect(storedB.crossPasses[0].note).toBe("updated");
    expect(storedB.crossPasses[0].time).toBe(2.5);
  });
});

describe("deleteTeam", () => {
  it("deletes the team and detaches tasks from every one of its lineups", async () => {
    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [],
      matchups: [{ name: "Lineup 1", dogs: [], crossPasses: [] }],
    });

    const task = await TaskModel.create({
      team: CLUB,
      description: "Linked task",
      dogs: [],
      position: { columnIndex: 0, rowIndex: 0, positionIndex: 0 },
      matchupRef: { squadId: team._id, matchupId: team.matchups[0]._id },
    });

    const res = mockRes();

    await deleteTeam({ club: CLUB, params: { id: team._id.toString() } }, res);

    expect(res.statusCode).toBe(200);
    expect(await TeamModel.findById(team._id)).toBeNull();

    const storedTask = await TaskModel.findById(task._id);

    expect(storedTask.toJSON().matchupRef).toBeUndefined();
  });
});
