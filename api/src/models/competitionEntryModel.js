const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// One dog slot from a parsed EJS row - matchedDogId only ever gets set for an ourTeam entry's dogs.
const competitionDogSchema = new Schema(
  {
    name: { type: String },
    matchedDogId: { type: Schema.Types.ObjectId },
    // True for dog 1 only - separate from the real CrossPass collection, this is just this row's own dog-to-dog running order.
    runningOnLights: { type: Boolean },
    runningOnDogId: { type: Schema.Types.ObjectId },
    // Number when clean, or a text fault code ("early"/"obok"/"ok") - see ejsParser.js.
    lightsTime: { type: Schema.Types.Mixed },
    crossTime: { type: Schema.Types.Mixed },
    // Also Mixed - the dog-time column can carry the same text fault codes as the changeover columns.
    time: { type: Schema.Types.Mixed },
    faulted: { type: Boolean, default: false },
  },
  { _id: false }
);

// A rerun pass attributed by color-matching to one of the row's 4 dogs (see ejsParser.js) - dogIndex is null if attribution failed.
const extraPassSchema = new Schema(
  {
    // Mixed for the same reason as competitionDogSchema.time - a rerun's own time cell can carry a text fault code too.
    time: { type: Schema.Types.Mixed },
    dogIndex: { type: Number },
  },
  { _id: false }
);

// One document per parsed EJS row (one team's own run in one heat) - see ejsParser.js for the full column mapping.
const competitionEntrySchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, required: true },
    // The uploaded file's own name - the only thing distinguishing rows from a multi-day competition split across separate .xls files.
    sourceFile: { type: String },
    // A "lineup" for stats is just a distinct 4-dog running order within the imported data - the ordered join of this row's own dog names (our-team rows only). Not tied to any registered Team.matchups.
    lineupKey: { type: String },
    race: { type: Number },
    division: { type: Number },
    match: { type: Number },
    time: { type: Date },
    teamName: { type: String, required: true },
    opponentName: { type: String },
    seedTime: { type: Number },
    seedNetTime: { type: Number },
    teamTime: { type: Number },
    teamNetTime: { type: Number },
    resultFlag: { type: String },
    result: { type: String },
    jumpHeight: { type: Number },
    dogs: { type: [competitionDogSchema] },
    extraPasses: { type: [extraPassSchema] },
    // True only for rows whose teamName was confirmed as ours at import time - opponent rows are kept for heat context, never dog-matched.
    ourTeam: { type: Boolean, default: false },
    team: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CompetitionEntry", competitionEntrySchema);
