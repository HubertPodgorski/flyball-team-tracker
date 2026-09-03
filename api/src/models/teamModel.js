const mongoose = require("mongoose");

const DogModel = require("./dogModel");

const Schema = mongoose.Schema;

// One cross-pass grid cell.
const lineupCrossPassSchema = new Schema({
  dogId: { type: Schema.Types.ObjectId, required: true },
  runningOnDog: { type: DogModel.schema },
  runningOnLights: { type: Boolean },
  note: { type: String },
  startingPosition: { type: String },
  time: { type: Number },
});

const lineupSchema = new Schema({
  name: { type: String },
  dogs: { type: [DogModel.schema], required: true },
  crossPasses: { type: [lineupCrossPassSchema] },
});

const teamSchema = new Schema(
  {
    name: { type: String, required: true },
    dogs: { type: [DogModel.schema] }, // ordered, up to 6
    matchups: { type: [lineupSchema] },
    team: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Collection stays "squads" - a field/collection data migration is a separate step.
module.exports = mongoose.model("Team", teamSchema, "squads");
