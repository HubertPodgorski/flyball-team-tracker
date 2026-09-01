const mongoose = require("mongoose");

const DogModel = require("./dogModel");

const Schema = mongoose.Schema;

// One cross-pass grid cell.
const matchupCrossPassSchema = new Schema({
  dogId: { type: Schema.Types.ObjectId, required: true },
  runningOnDog: { type: DogModel.schema },
  runningOnLights: { type: Boolean },
  note: { type: String },
  startingPosition: { type: String },
  time: { type: Number },
});

const matchupSchema = new Schema({
  name: { type: String },
  dogs: { type: [DogModel.schema], required: true },
  crossPasses: { type: [matchupCrossPassSchema] },
});

const squadSchema = new Schema(
  {
    name: { type: String, required: true },
    dogs: { type: [DogModel.schema] }, // ordered, up to 6
    matchups: { type: [matchupSchema] },
    team: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Squad", squadSchema);
