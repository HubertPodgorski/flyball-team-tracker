const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dogSchema = new Schema({
  name: { type: String, required: true },
  team: { type: String, required: true },
  note: { type: String },
});

module.exports = mongoose.model("Dog", dogSchema);
