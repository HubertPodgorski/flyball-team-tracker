const mongoose = require("mongoose");

const DogModel = require("./dogModel");

const Schema = mongoose.Schema;

const taskSchema = new Schema(
  {
    dogs: {
      type: [DogModel.schema],
    },
    description: { type: String },
    position: {
      columnIndex: {
        type: Number,
        required: true,
      },
      rowIndex: { type: Number, required: true },
      positionIndex: { type: Number, required: true },
    },
    team: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
