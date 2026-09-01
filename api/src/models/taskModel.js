const mongoose = require("mongoose");

const DogModel = require("./dogModel");

const Schema = mongoose.Schema;

const taskSchema = new Schema(
  {
    dogs: {
      type: [DogModel.schema],
    },
    // Kept even if dogs later drift from the matchup.
    matchupRef: {
      squadId: { type: Schema.Types.ObjectId },
      matchupId: { type: Schema.Types.ObjectId },
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
