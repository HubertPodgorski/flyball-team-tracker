import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { migrateOrphanTasksToNextEvent, MIGRATION_ID } from "./taskMigration.js";

const TaskModel = mongoose.model("Task");
const EventModel = mongoose.model("Event");

const position = { columnIndex: 0, rowIndex: 0, positionIndex: 0 };
const iso = (daysFromNow) => new Date(Date.now() + daysFromNow * 86400000).toISOString();

describe("migrateOrphanTasksToNextEvent", () => {
  it("moves a club's un-scoped tasks onto its next upcoming event", async () => {
    const club = "TEST_TEAM";
    await EventModel.create({ name: "Past", date: iso(-10), type: "TRAINING", team: club });
    const next = await EventModel.create({ name: "Soon", date: iso(3), type: "TRAINING", team: club });
    await EventModel.create({ name: "Later", date: iso(20), type: "TRAINING", team: club });

    await TaskModel.create({ team: club, description: "old plan a", position });
    await TaskModel.collection.insertOne({ team: club, description: "old plan b", position, createdAt: new Date(), updatedAt: new Date() });
    await TaskModel.create({ team: club, description: "already scoped", position, eventId: next._id });

    const result = await migrateOrphanTasksToNextEvent();

    expect(result.movedTasks).toBe(2);
    const moved = await TaskModel.find({ team: club, eventId: next._id });
    expect(moved.map((task) => task.description).sort()).toEqual(["already scoped", "old plan a", "old plan b"]);
  });

  it("leaves un-scoped tasks alone when the club has no upcoming event", async () => {
    const club = "TEST_TEAM";
    await EventModel.create({ name: "Past only", date: iso(-5), type: "TRAINING", team: club });
    await TaskModel.create({ team: club, description: "stays on default board", position });

    await migrateOrphanTasksToNextEvent();

    const task = await TaskModel.findOne({ team: club });
    expect(task.eventId).toBeNull();
  });

  it("runs once - a second call is a no-op", async () => {
    const club = "TEST_TEAM";
    const next = await EventModel.create({ name: "Soon", date: iso(2), type: "TRAINING", team: club });
    await TaskModel.create({ team: club, description: "a", position });

    await migrateOrphanTasksToNextEvent();
    // A task created afterwards on the default board must not be swept up by a later run.
    await TaskModel.create({ team: club, description: "later default-board task", position });

    const second = await migrateOrphanTasksToNextEvent();

    expect(second.skipped).toBe(true);
    expect((await TaskModel.findOne({ description: "later default-board task" })).eventId).toBeNull();
    expect((await TaskModel.findOne({ description: "a" })).eventId?.toString()).toBe(next._id.toString());
    expect(await mongoose.connection.collection("migrations").findOne({ _id: MIGRATION_ID })).toBeTruthy();
  });
});
