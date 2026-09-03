const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dogSchema = new Schema({
  name: { type: String, required: true },
  team: { type: String, required: true },
  note: { type: String },
  // cm. Optional - a dog without one defaults to the max height (35cm) for
  // lineup jump-height calculations only, never displayed as a real value.
  jumpHeight: { type: Number },
  // When true, editing this dog's cross-pass timing/note/starting-position
  // in one lineup propagates to every other lineup entry with the same
  // predecessor (same dogId + same runningOnDog/lights) - see
  // helpers/crossPassSync.js. Off by default: each lineup stays independent.
  syncCrossPasses: { type: Boolean, default: false },
  // Independent of syncCrossPasses above - when true, this dog's lineup
  // cross-pass entries also stay in sync with its standalone My Dogs
  // cross-passes (same dogId + same predecessor bridges the two systems).
  syncCrossPassesWithMyDogs: { type: Boolean, default: false },
});

module.exports = mongoose.model("Dog", dogSchema);
