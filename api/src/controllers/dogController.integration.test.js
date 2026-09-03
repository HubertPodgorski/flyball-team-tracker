import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import dogControllerModule from "./dogController.js";
import testHelpersModule from "../testHelpers.js";

const { getDogs, createDog, updateDog, deleteDog } = dogControllerModule;
const DogModel = mongoose.model("Dog");
const TaskModel = mongoose.model("Task");
const TeamModel = mongoose.model("Team");
const UserModel = mongoose.model("User");
const CrossPassModel = mongoose.model("CrossPass");
const { mockRes } = testHelpersModule;

const CLUB = "TEST_TEAM";

describe("getDogs", () => {
  it("only returns dogs for the caller's club", async () => {
    await DogModel.create({ name: "Mine", team: CLUB });
    await DogModel.create({ name: "Theirs", team: "OTHER_CLUB" });

    const res = mockRes();

    await getDogs({ club: CLUB }, res);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Mine");
  });
});

describe("createDog", () => {
  it("creates a dog scoped to the caller's club", async () => {
    const res = mockRes();

    await createDog({ club: CLUB, body: { name: "Api" } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.team).toBe(CLUB);
  });
});

describe("updateDog", () => {
  it("404s for a dog that doesn't belong to the caller's club", async () => {
    const dog = await DogModel.create({ name: "Theirs", team: "OTHER_CLUB" });
    const res = mockRes();

    await updateDog({ club: CLUB, body: { _id: dog._id.toString(), name: "Hijacked" } }, res);

    expect(res.statusCode).toBe(404);
  });

  it("propagates a field change to every embedded copy: Task, Team pool, lineup, User", async () => {
    const dog = await DogModel.create({ name: "Api", team: CLUB, jumpHeight: 20 });

    const task = await TaskModel.create({
      team: CLUB,
      dogs: [dog.toObject()],
      position: { columnIndex: 0, rowIndex: 0, positionIndex: 0 },
    });
    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [dog.toObject()],
      matchups: [{ name: "Lineup", dogs: [dog.toObject()], crossPasses: [] }],
    });
    const user = await UserModel.create({
      name: "Hubert",
      email: "hubert@example.com",
      password: "hashed",
      team: CLUB,
      dogs: [dog.toObject()],
    });

    const res = mockRes();

    await updateDog({ club: CLUB, body: { _id: dog._id.toString(), jumpHeight: 25 } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.jumpHeight).toBe(25);

    const [storedTask, storedTeam, storedUser] = await Promise.all([
      TaskModel.findById(task._id),
      TeamModel.findById(team._id),
      UserModel.findById(user._id),
    ]);

    expect(storedTask.dogs[0].jumpHeight).toBe(25);
    expect(storedTeam.dogs[0].jumpHeight).toBe(25);
    expect(storedTeam.matchups[0].dogs[0].jumpHeight).toBe(25);
    expect(storedUser.dogs[0].jumpHeight).toBe(25);
  });

  it("refreshes runningOnDog on both standalone and lineup cross-passes", async () => {
    const predecessor = await DogModel.create({ name: "Predecessor", team: CLUB, jumpHeight: 20 });
    const runner = await DogModel.create({ name: "Runner", team: CLUB });

    const standaloneCrossPass = await CrossPassModel.create({
      team: CLUB,
      dogId: runner._id,
      runningOnDog: predecessor.toObject(),
    });
    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [],
      matchups: [
        {
          name: "Lineup",
          dogs: [],
          crossPasses: [{ dogId: runner._id, runningOnDog: predecessor.toObject() }],
        },
      ],
    });

    const res = mockRes();

    await updateDog({ club: CLUB, body: { _id: predecessor._id.toString(), jumpHeight: 30 } }, res);

    expect(res.statusCode).toBe(200);

    const [storedStandalone, storedTeam] = await Promise.all([
      CrossPassModel.findById(standaloneCrossPass._id),
      TeamModel.findById(team._id),
    ]);

    expect(storedStandalone.runningOnDog.jumpHeight).toBe(30);
    expect(storedTeam.matchups[0].crossPasses[0].runningOnDog.jumpHeight).toBe(30);
  });
});

describe("deleteDog", () => {
  it("removes the dog from every Task/Team/lineup/User it was embedded in", async () => {
    const dog = await DogModel.create({ name: "Api", team: CLUB });

    const task = await TaskModel.create({
      team: CLUB,
      dogs: [dog.toObject()],
      position: { columnIndex: 0, rowIndex: 0, positionIndex: 0 },
    });
    const team = await TeamModel.create({
      name: "Squad",
      team: CLUB,
      dogs: [dog.toObject()],
      matchups: [{ name: "Lineup", dogs: [dog.toObject()], crossPasses: [] }],
    });
    const user = await UserModel.create({
      name: "Hubert",
      email: "hubert2@example.com",
      password: "hashed",
      team: CLUB,
      dogs: [dog.toObject()],
    });

    const res = mockRes();

    await deleteDog({ club: CLUB, params: { id: dog._id.toString() } }, res);

    expect(res.statusCode).toBe(200);
    expect(await DogModel.findById(dog._id)).toBeNull();

    const [storedTask, storedTeam, storedUser] = await Promise.all([
      TaskModel.findById(task._id),
      TeamModel.findById(team._id),
      UserModel.findById(user._id),
    ]);

    expect(storedTask.dogs).toEqual([]);
    expect(storedTeam.dogs).toEqual([]);
    expect(storedTeam.matchups[0].dogs).toEqual([]);
    expect(storedUser.dogs).toEqual([]);
  });

  it("deletes cross-passes the dog owns, and clears (not deletes) ones where it was the predecessor", async () => {
    const owner = await DogModel.create({ name: "Owner", team: CLUB });
    const predecessor = await DogModel.create({ name: "Predecessor", team: CLUB });

    const ownedCrossPass = await CrossPassModel.create({ team: CLUB, dogId: owner._id });
    const dependentCrossPass = await CrossPassModel.create({
      team: CLUB,
      dogId: predecessor._id, // different owner - survives
      runningOnDog: owner.toObject(),
    });

    const res = mockRes();

    await deleteDog({ club: CLUB, params: { id: owner._id.toString() } }, res);

    expect(res.statusCode).toBe(200);
    expect(await CrossPassModel.findById(ownedCrossPass._id)).toBeNull();

    const storedDependent = await CrossPassModel.findById(dependentCrossPass._id);

    expect(storedDependent).not.toBeNull();
    expect(storedDependent.toJSON().runningOnDog).toBeUndefined();
  });
});
