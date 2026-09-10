const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Global (not per-club): a team name as it appears in an EJS export -> the club that team belongs to.
// A club can own several EJS names ("Dzikie Gziki A" / "Dzikie Gziki B" both -> DZIKIE_GZIKI); each name has one owner.
const ejsTeamMappingSchema = new Schema(
  {
    ejsTeamName: { type: String, required: true, unique: true, trim: true },
    club: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EjsTeamMapping", ejsTeamMappingSchema);
