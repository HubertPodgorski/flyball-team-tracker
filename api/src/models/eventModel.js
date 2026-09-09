const mongoose = require("mongoose");
const DogModel = require("./dogModel");
const UserModel = require("./userModel");

const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    date: { type: String, required: true },
    // Multi-day Competition/Seminary only - optional, no time-of-day meaning, just the last calendar day it runs through.
    endDate: { type: String, required: false },
    name: { type: String, required: true },
    dogs: {
      type: [
        {
          status: { type: String },
          _id: { type: String },
        },
      ],
      required: false,
    },
    type: {
      type: String,
      required: true,
    },
    users: {
      type: [
        {
          status: { type: String },
          _id: { type: String },
        },
      ],
      required: false,
    },
    team: { type: String, required: true },
    // Set once the attendance-reminder push fires (automatic or manual) -
    // makes the cron's check exactly-once regardless of how many ticks land in the window.
    reminderSentAt: { type: Date, required: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);
