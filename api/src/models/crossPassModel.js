const mongoose = require("mongoose");

const DogModel = require("./dogModel");

const Schema = mongoose.Schema;

const crossPassSchema = new Schema(
  {
    dogId: { type: Schema.Types.ObjectId },
    runningOnDog: { type: DogModel.schema },
    runningOnLights: { type: Boolean },
    note: { type: String },
    startingPosition: { type: String },
    team: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CrossPass", crossPassSchema);
