const mongoose = require("mongoose");
const DogModel = require("./dogModel");
const UserModel = require("./userModel");

const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    date: { type: String, required: true },
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);
