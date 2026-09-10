const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// One row per club. Replaces the two hardcoded lists (clubCodeMap in userModel.js, CLUBS in helpers/teams.js).
const clubSchema = new Schema(
  {
    // What a user types on signup - can read differently than the stored `team` value (e.g. "TEST" -> "TEST_TEAM").
    code: { type: String, required: true, unique: true, trim: true },
    // The identifier stored as the `team` field on every other document in the club.
    team: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    // Suspended = read-only: members can still sign in and view, but every write is rejected.
    suspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Club", clubSchema);
