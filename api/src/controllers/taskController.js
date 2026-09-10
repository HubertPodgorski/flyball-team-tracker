const TaskModel = require("../models/taskModel");
const EventModel = require("../models/eventModel");
const { broadcast } = require("../sse");

const findClubTasks = (club) =>
  TaskModel.find({ team: club }).sort({ createdAt: -1 });

// ?eventId=<id> for one session's board, ?eventId=none for the default board (null eventId, plus pre-field tasks), nothing for every task in the club.
const getTasks = async (req, res) => {
  const { eventId } = req.query;
  const filter = { team: req.club };

  if (eventId === "none") filter.eventId = null;
  else if (eventId) filter.eventId = eventId;

  const tasks = await TaskModel.find(filter).sort({ createdAt: -1 });

  res.status(200).json(tasks);
};

const createTask = async (req, res) => {
  const { dogs, description, position, matchupRef, eventId } = req.body;

  const task = await TaskModel.create({
    dogs,
    description,
    position,
    matchupRef,
    eventId: typeof eventId === "string" && eventId ? eventId : null,
    team: req.club,
  });

  res.status(200).json(task);
  broadcast(req.club, "tasks_updated", await findClubTasks(req.club));
};

const updateTask = async (req, res) => {
  const { _id, ...data } = req.body;

  const task = await TaskModel.findOneAndUpdate(
    { _id, team: req.club },
    { ...data, team: req.club },
    { returnDocument: "after" }
  );

  if (!task) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  res.status(200).json(task);
  broadcast(req.club, "tasks_updated", await findClubTasks(req.club));
};

const deleteTask = async (req, res) => {
  const { id } = req.params;

  await TaskModel.findOneAndDelete({ _id: id, team: req.club });

  res.status(200).json({ ok: true });
  broadcast(req.club, "tasks_updated", await findClubTasks(req.club));
};

// body = { tasks: [{ _id, position }, ...] }
// Single bulk round trip instead of N sequential updates - looping here
// once produced a visible delay in the "tasks_updated" echo during drag.
const reorderTasks = async (req, res) => {
  const { tasks } = req.body;

  if (tasks?.length) {
    await TaskModel.bulkWrite(
      tasks.map((task) => ({
        updateOne: {
          filter: { _id: task._id, team: req.club },
          update: { ...task },
        },
      }))
    );
  }

  res.status(200).json({ ok: true });
  broadcast(req.club, "tasks_updated", await findClubTasks(req.club));
};

// Seeds one session's board from an already-planned session. "Previous" = the most recent earlier event with a plan;
// if planning was done out of order and nothing earlier is planned, falls back to the most recently planned session.
const copyTasksFromPreviousSession = async (req, res) => {
  const { toEventId } = req.body;

  if (!toEventId) return res.status(400).json({ error: "MISSING_TARGET" });

  const target = await EventModel.findOne({ _id: toEventId, team: req.club });

  if (!target) return res.status(404).json({ error: "EVENT_NOT_FOUND" });

  const plannedEventIds = (await TaskModel.distinct("eventId", { team: req.club, eventId: { $ne: null } })).filter(
    (id) => String(id) !== String(toEventId)
  );

  if (plannedEventIds.length === 0) return res.status(200).json({ copied: 0 });

  const plannedEvents = await EventModel.find({ _id: { $in: plannedEventIds }, team: req.club });
  const earlier = plannedEvents
    .filter((event) => new Date(event.date) < new Date(target.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let sourceEventId = earlier[0]?._id;

  if (!sourceEventId) {
    const newestPlannedTask = await TaskModel.findOne({ team: req.club, eventId: { $in: plannedEventIds } }).sort({ createdAt: -1 });

    sourceEventId = newestPlannedTask?.eventId;
  }

  if (!sourceEventId) return res.status(200).json({ copied: 0 });

  const sourceTasks = await TaskModel.find({ team: req.club, eventId: sourceEventId });
  const copies = sourceTasks.map((task) => ({
    dogs: task.dogs,
    description: task.description,
    position: task.position,
    matchupRef: task.matchupRef,
    eventId: toEventId,
    team: req.club,
  }));

  if (copies.length) await TaskModel.insertMany(copies);

  res.status(200).json({ copied: copies.length, fromEventId: sourceEventId });
  broadcast(req.club, "tasks_updated", await findClubTasks(req.club));
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  copyTasksFromPreviousSession,
};
