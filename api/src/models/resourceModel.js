const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const resourceSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    team: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
