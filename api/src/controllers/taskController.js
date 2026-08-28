const TaskModel = require("../models/taskModel");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// get all tasks
const getAllTasks = async (callback, userToken) => {
  const { team } = jwt.decode(userToken);

  const tasks = await TaskModel.find({ team }).sort({
    createdAt: -1,
  });

  callback(tasks);
};

// get single task
const getTaskById = async (received, callback) => {
  const { _id } = received;

  // TODO: handle that
  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "TASK_NOT_FOUND" });
  // }

  const task = await TaskModel.findById(_id);

  // TODO: handle that
  // if (!task) {
  //   return res.status(404).json({ error: "TASK_NOT_FOUND" });
  // }

  callback(task);
};

// create new task
const createTask = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);
  const { dogs, description, position } = received;

  const task = await TaskModel.create({ dogs, description, position, team });

  // TODO: handle that
  // try {
  //   res.status(200).json(task);
  // } catch (error) {
  //   res.status(400).json({ error: error.message });
  // }

  const allTasks = await TaskModel.find({ team });

  callback(task);

  io.to(team).emit("tasks_updated", allTasks);
};

// delete task
const deleteTaskById = async (received, io, userToken) => {
  const { team } = jwt.decode(userToken);
  const { _id } = received;

  // TODO: handle that
  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "TASK_NOT_FOUND" });
  // }

  await TaskModel.findOneAndDelete({ _id });

  // TODO: handle that
  // if (!task) {
  //   return res.status(400).json({ error: "TASK_NOT_FOUND" });
  // }

  const allTasks = await TaskModel.find({ team });

  io.to(team).emit("tasks_updated", allTasks);
};

// update task
const updateTaskById = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);
  const { _id } = received;

  // TODO: handle that
  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "TASK_NOT_FOUND" });
  // }

  const task = await TaskModel.findOneAndUpdate(
    { _id },
    { ...received },
    { new: true }
  );

  // TODO: handle that
  // if (!task) {
  //   return res.status(404).json({ error: "TASK_NOT_FOUND" });
  // }

  const allTasks = await TaskModel.find({ team });

  callback(task);

  io.to(team).emit("tasks_updated", allTasks);
};

// update tasks order // body = {tasks: [{_id: xx, position: {...}}, {_id: xx2, position: {...}}]}
const updateTasksOrder = async (received, io, userToken) => {
  const { team } = jwt.decode(userToken);

  for (const task of received.tasks) {
    await TaskModel.findOneAndUpdate({ _id: task._id }, { ...task });
  }

  const allTasks = await TaskModel.find({ team });

  io.to(team).emit("tasks_updated", allTasks);
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  deleteTaskById,
  updateTaskById,
  updateTasksOrder,
};
