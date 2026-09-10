import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import taskControllerModule from "./taskController.js";
import testHelpersModule from "../testHelpers.js";

const { getTasks, createTask, copyTasksFromPreviousSession } = taskControllerModule;
const TaskModel = mongoose.model("Task");
const EventModel = mongoose.model("Event");
const { mockRes } = testHelpersModule;

const CLUB = "TEST_TEAM";
const position = { columnIndex: 0, rowIndex: 0, positionIndex: 0 };

const seedEvent = (date) => EventModel.create({ name: "S", date, type: "TRAINING", team: CLUB });

const seedTask = (overrides) =>
  TaskModel.create({ team: CLUB, description: "t", position, ...overrides });

describe("getTasks - event scoping", () => {
  it("?eventId=<id> returns only that session's board", async () => {
    const eventId = new mongoose.Types.ObjectId();

    await seedTask({ eventId, description: "for-event" });
    await seedTask({ eventId: new mongoose.Types.ObjectId(), description: "other-event" });
    await seedTask({ description: "default-board" });

    const res = mockRes();

    await getTasks({ club: CLUB, query: { eventId: eventId.toString() } }, res);

    expect(res.body.map((task) => task.description)).toEqual(["for-event"]);
  });

  it("?eventId=none returns the default board, including tasks saved before the field existed", async () => {
    await seedTask({ eventId: null, description: "explicit-null" });
    await TaskModel.collection.insertOne({
      team: CLUB,
      description: "pre-field",
      position,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await seedTask({ eventId: new mongoose.Types.ObjectId(), description: "has-event" });

    const res = mockRes();

    await getTasks({ club: CLUB, query: { eventId: "none" } }, res);

    expect(res.body.map((task) => task.description).sort()).toEqual(["explicit-null", "pre-field"]);
  });

  it("with no eventId param returns every task in the club", async () => {
    await seedTask({ eventId: new mongoose.Types.ObjectId() });
    await seedTask({ eventId: null });

    const res = mockRes();

    await getTasks({ club: CLUB, query: {} }, res);

    expect(res.body).toHaveLength(2);
  });

  it("never leaks another club's tasks even when the eventId matches", async () => {
    const eventId = new mongoose.Types.ObjectId();

    await seedTask({ eventId });
    await TaskModel.create({ team: "OTHER_CLUB", description: "theirs", position, eventId });

    const res = mockRes();

    await getTasks({ club: CLUB, query: { eventId: eventId.toString() } }, res);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].team).toBe(CLUB);
  });
});

describe("createTask - event scoping", () => {
  it("persists the eventId from the body", async () => {
    const eventId = new mongoose.Types.ObjectId();
    const res = mockRes();

    await createTask({ club: CLUB, body: { description: "x", dogs: [], position, eventId: eventId.toString() } }, res);

    expect(res.statusCode).toBe(200);
    expect(String(res.body.eventId)).toBe(eventId.toString());
  });

  it("defaults eventId to null when the body omits it", async () => {
    const res = mockRes();

    await createTask({ club: CLUB, body: { description: "x", dogs: [], position } }, res);

    expect(res.body.eventId).toBeNull();
  });
});

describe("copyTasksFromPreviousSession", () => {
  it("copies the most recent earlier planned session onto the target board", async () => {
    const jan = await seedEvent("2026-01-10");
    const feb = await seedEvent("2026-02-10");
    const mar = await seedEvent("2026-03-10");

    await TaskModel.create({ team: CLUB, description: "jan drill", position, eventId: jan._id });
    await TaskModel.create({ team: CLUB, description: "feb drill", position, eventId: feb._id });

    const res = mockRes();

    await copyTasksFromPreviousSession({ club: CLUB, body: { toEventId: mar._id.toString() } }, res);

    expect(res.body.copied).toBe(1);
    expect(String(res.body.fromEventId)).toBe(feb._id.toString());

    const marTasks = await TaskModel.find({ team: CLUB, eventId: mar._id });

    expect(marTasks.map((task) => task.description)).toEqual(["feb drill"]);
  });

  it("falls back to the most recently planned session when nothing earlier is planned", async () => {
    const early = await seedEvent("2026-01-10");
    const later = await seedEvent("2026-05-10");

    // Only a later session is planned - planning was done out of order.
    await TaskModel.create({ team: CLUB, description: "later drill", position, eventId: later._id });

    const res = mockRes();

    await copyTasksFromPreviousSession({ club: CLUB, body: { toEventId: early._id.toString() } }, res);

    expect(res.body.copied).toBe(1);
    expect(String(res.body.fromEventId)).toBe(later._id.toString());
  });

  it("copies nothing when no other session has a plan", async () => {
    const target = await seedEvent("2026-03-10");

    const res = mockRes();

    await copyTasksFromPreviousSession({ club: CLUB, body: { toEventId: target._id.toString() } }, res);

    expect(res.body.copied).toBe(0);
  });

  it("404s for an event that isn't the caller's club", async () => {
    const target = await seedEvent("2026-03-10");

    const res = mockRes();

    await copyTasksFromPreviousSession({ club: "OTHER_CLUB", body: { toEventId: target._id.toString() } }, res);

    expect(res.statusCode).toBe(404);
  });
});
