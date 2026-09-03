import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import crossPassControllerModule from "./crossPassController.js";
import testHelpersModule from "../testHelpers.js";

const { getCrossPasses, createCrossPass, updateCrossPass, deleteCrossPass } =
  crossPassControllerModule;
const CrossPassModel = mongoose.model("CrossPass");
const DogModel = mongoose.model("Dog");
const TeamModel = mongoose.model("Team");
const { mockRes } = testHelpersModule;

const CLUB = "TEST_TEAM";

describe("getCrossPasses", () => {
  it("only returns cross-passes for the caller's club", async () => {
    await CrossPassModel.create({ team: CLUB, dogId: new mongoose.Types.ObjectId() });
    await CrossPassModel.create({ team: "OTHER_CLUB", dogId: new mongoose.Types.ObjectId() });

    const res = mockRes();

    await getCrossPasses({ club: CLUB }, res);

    expect(res.body).toHaveLength(1);
  });
});

describe("createCrossPass", () => {
  it("creates a cross-pass scoped to the caller's club", async () => {
    const dog = await DogModel.create({ name: "Api", team: CLUB });
    const res = mockRes();

    await createCrossPass({ club: CLUB, body: { dogId: dog._id } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.team).toBe(CLUB);
  });

  it("does not touch lineups when the dog has syncCrossPassesWithMyDogs off", async () => {
    const runner = await DogModel.create({ name: "Runner", team: CLUB });
    const predecessor = await DogModel.create({ name: "Predecessor", team: CLUB });

    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [],
      matchups: [
        {
          name: "Lineup",
          dogs: [],
          crossPasses: [
            { dogId: runner._id, runningOnDog: predecessor.toObject(), note: "old" },
          ],
        },
      ],
    });

    const res = mockRes();

    await createCrossPass(
      {
        club: CLUB,
        body: { dogId: runner._id, runningOnDog: predecessor.toObject(), note: "new" },
      },
      res
    );

    const stored = await TeamModel.findById(team._id);

    expect(stored.matchups[0].crossPasses[0].note).toBe("old");
  });
});

describe("updateCrossPass - My Dogs -> lineup bridge", () => {
  it("pushes timing into every matching lineup entry when syncCrossPassesWithMyDogs is on", async () => {
    const runner = await DogModel.create({
      name: "Runner",
      team: CLUB,
      syncCrossPassesWithMyDogs: true,
    });
    const predecessor = await DogModel.create({ name: "Predecessor", team: CLUB });

    const crossPass = await CrossPassModel.create({
      team: CLUB,
      dogId: runner._id,
      runningOnDog: predecessor.toObject(),
      note: "old",
      time: 1,
    });

    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [],
      matchups: [
        {
          name: "Lineup",
          dogs: [],
          crossPasses: [
            { dogId: runner._id, runningOnDog: predecessor.toObject(), note: "old", time: 1 },
          ],
        },
      ],
    });

    const res = mockRes();

    await updateCrossPass(
      { club: CLUB, body: { _id: crossPass._id.toString(), note: "updated", time: 3.2 } },
      res
    );

    expect(res.statusCode).toBe(200);

    const stored = await TeamModel.findById(team._id);

    expect(stored.matchups[0].crossPasses[0].note).toBe("updated");
    expect(stored.matchups[0].crossPasses[0].time).toBe(3.2);
  });

  it("does not touch lineups when syncCrossPassesWithMyDogs is off", async () => {
    const runner = await DogModel.create({ name: "Runner", team: CLUB });
    const predecessor = await DogModel.create({ name: "Predecessor", team: CLUB });

    const crossPass = await CrossPassModel.create({
      team: CLUB,
      dogId: runner._id,
      runningOnDog: predecessor.toObject(),
      note: "old",
    });

    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [],
      matchups: [
        {
          name: "Lineup",
          dogs: [],
          crossPasses: [
            { dogId: runner._id, runningOnDog: predecessor.toObject(), note: "old" },
          ],
        },
      ],
    });

    const res = mockRes();

    await updateCrossPass(
      { club: CLUB, body: { _id: crossPass._id.toString(), note: "updated" } },
      res
    );

    expect(res.statusCode).toBe(200);

    const stored = await TeamModel.findById(team._id);

    expect(stored.matchups[0].crossPasses[0].note).toBe("old");
  });
});

describe("deleteCrossPass", () => {
  it("deletes the cross-pass", async () => {
    const crossPass = await CrossPassModel.create({
      team: CLUB,
      dogId: new mongoose.Types.ObjectId(),
    });

    const res = mockRes();

    await deleteCrossPass({ club: CLUB, params: { id: crossPass._id.toString() } }, res);

    expect(res.statusCode).toBe(200);
    expect(await CrossPassModel.findById(crossPass._id)).toBeNull();
  });
});
