const mongoose = require("mongoose");

const DogModel = require("./dogModel");

const Schema = mongoose.Schema;

const taskSchema = new Schema(
  {
    dogs: {
      type: [DogModel.schema],
    },
    // Which training session this task is planned for. null = the club's default board (also every task from before this field existed).
    eventId: { type: Schema.Types.ObjectId, default: null },
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

taskSchema.index({ team: 1, eventId: 1 });

module.exports = mongoose.model("Task", taskSchema);
