const mongoose = require("mongoose");
const TaskModel = require("../models/taskModel");
const EventModel = require("../models/eventModel");

// Runs once ever. Task boards used to be one global list per club; they're now scoped to a session (event).
// Every pre-existing task has no eventId, so it only shows on the default board - move each club's tasks onto
// its nearest upcoming event (where the trainer and members now look). Clubs with no upcoming event keep their
// tasks on the default board, which is still shown to everyone.
const MIGRATION_ID = "tasks-to-next-upcoming-event";

const orphanFilter = { $or: [{ eventId: null }, { eventId: { $exists: false } }] };

const migrateOrphanTasksToNextEvent = async () => {
  const migrations = mongoose.connection.collection("migrations");

  if (await migrations.findOne({ _id: MIGRATION_ID })) return { skipped: true };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const clubs = await TaskModel.distinct("team", orphanFilter);
  let movedTasks = 0;
  let movedClubs = 0;

  for (const club of clubs) {
    const events = await EventModel.find({ team: club }).lean();
    const nextEvent = events
      .filter((event) => new Date(event.endDate || event.date) >= startOfToday)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    if (!nextEvent) continue;

    const { modifiedCount } = await TaskModel.updateMany(
      { team: club, ...orphanFilter },
      { $set: { eventId: nextEvent._id } }
    );

    movedTasks += modifiedCount;
    movedClubs += 1;
  }

  await migrations.insertOne({ _id: MIGRATION_ID, ranAt: new Date(), movedTasks, movedClubs });

  return { movedTasks, movedClubs };
};

module.exports = { migrateOrphanTasksToNextEvent, MIGRATION_ID };
