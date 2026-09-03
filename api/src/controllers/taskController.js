const TaskModel = require("../models/taskModel");
const { broadcast } = require("../sse");

const findClubTasks = (club) =>
  TaskModel.find({ team: club }).sort({ createdAt: -1 });

const getTasks = async (req, res) => {
  const tasks = await findClubTasks(req.club);

  res.status(200).json(tasks);
};

const createTask = async (req, res) => {
  const { dogs, description, position, matchupRef } = req.body;

  const task = await TaskModel.create({
    dogs,
    description,
    position,
    matchupRef,
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

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
};
