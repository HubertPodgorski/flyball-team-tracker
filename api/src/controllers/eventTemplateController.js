const EventTemplateModel = require("../models/eventTemplateModel");
const TaskModel = require("../models/taskModel");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// get all event templates
const getAllEventTemplates = async (callback, userToken) => {
  const { team } = jwt.decode(userToken);

  const eventTemplates = await EventTemplateModel.find({ team }).sort({
    createdAt: -1,
  });

  callback(eventTemplates);
};

// get single eventTemplate
const getEventTemplateById = async (received, callback) => {
  const { _id } = received;

  // if (!mongoose.Types.ObjectId.isValid(_id)) {
  //   return res.status(404).json({ error: "EVENT_TEMPLATE_NOT_FOUND" });
  // }

  const eventTemplate = await EventTemplateModel.findById(_id);

  callback(eventTemplate);
};

// create new eventTemplate
const createEventTemplate = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const tasks = await TaskModel.find({ team });

  const eventTemplateFound = await EventTemplateModel.findOne({
    name: received.name,
    team,
  });

  let eventTemplate;

  if (eventTemplateFound) {
    eventTemplate = await EventTemplateModel.updateOne(
      {
        name: received.name,
        team,
      },
      { ...received, tasks }
    );
  } else {
    eventTemplate = await EventTemplateModel.create({
      ...received,
      tasks,
      team,
    });
  }

  const allEventTemplates = await EventTemplateModel.find({ team });

  callback("create_event_template", eventTemplate);
  io.to(team).emit("event_templates_updated", allEventTemplates);
};

// delete eventTemplate
const deleteEventTemplateById = async (received, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { _id } = received;

  // TODO: WS handler for eventTemplate not found
  // if (!mongoose.Types.ObjectId.isValid(_id)) {
  //   return res.status(404).json({ error: "EVENT_TEMPLATE_NOT_FOUND" });
  // }

  await EventTemplateModel.findOneAndDelete({ _id });

  // TODO: WS handler for eventTemplate not found

  const allEventTemplates = await EventTemplateModel.find({ team });
  io.to(team).emit("event_templates_updated", allEventTemplates);
};

// update eventTemplate
const updateEventTemplateById = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { _id } = received;

  // TODO: WS handler for eventTemplate not found
  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "EVENT_TEMPLATE_NOT_FOUND" });
  // }

  const eventTemplate = await EventTemplateModel.findOneAndUpdate(
    { _id: _id },
    { ...received, team },
    { new: true }
  );

  // TODO: WS handler for event template not found
  // if (!eventTemplate) {
  //   return res.status(404).json({ error: "EVENT_TEMPLATE_NOT_FOUND" });
  // }

  const allEventTemplates = await EventTemplateModel.find({ team });

  callback(eventTemplate);
  io.to(team).emit("event_templates_updated", allEventTemplates);
};

// load tasks from event template
const loadTasksFromEventTemplate = async (received, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { eventTemplateId } = received;

  // TODO: WS handler for eventTemplate not found
  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "EVENT_TEMPLATE_NOT_FOUND" });
  // }

  const eventTemplate = await EventTemplateModel.findById(eventTemplateId);

  // TODO: error handling
  if (!eventTemplate || !eventTemplate.tasks || !eventTemplate.tasks.length)
    return;

  // TODO: revert on error while deleting
  // const currentTasks = TaskModel.find({});

  await TaskModel.deleteMany({ team });
  // try {
  //   await TaskModel.deleteMany({});
  // } catch (e) {
  //   // TODO: error handling
  // }

  // TODO: error handling
  await TaskModel.insertMany(eventTemplate.tasks);

  // TODO: WS handler for event template not found
  // if (!eventTemplate) {
  //   return res.status(404).json({ error: "EVENT_TEMPLATE_NOT_FOUND" });
  // }

  io.to(team).emit("tasks_updated", eventTemplate.tasks);
};

module.exports = {
  createEventTemplate,
  getAllEventTemplates,
  getEventTemplateById,
  deleteEventTemplateById,
  updateEventTemplateById,
  loadTasksFromEventTemplate,
};
