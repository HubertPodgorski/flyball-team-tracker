const mongoose = require("mongoose");
const TaskModel = require("./taskModel");

const Schema = mongoose.Schema;

const eventTemplate = new Schema({
  name: { type: String, required: true },
  tasks: { type: [TaskModel.schema] },
  team: { type: String, required: true },
});

module.exports = mongoose.model("EventTemplate", eventTemplate);
