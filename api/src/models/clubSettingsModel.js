const mongoose = require("mongoose");
const { DEFAULT_FEATURES } = require("../helpers/clubFeatures");

const Schema = mongoose.Schema;

const featuresSchema = new Schema(
  Object.fromEntries(
    Object.entries(DEFAULT_FEATURES).map(([key, defaultValue]) => [
      key,
      { type: Boolean, default: defaultValue },
    ])
  ),
  { _id: false }
);

// DB field stays `team` (matches every other club-scoped collection) even
// though the surrounding code says `club` - see CLAUDE.md's naming note.
const clubSettingsSchema = new Schema(
  {
    team: { type: String, required: true, unique: true },
    features: { type: featuresSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClubSettings", clubSettingsSchema);
