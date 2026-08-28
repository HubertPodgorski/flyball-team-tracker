const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const DogModel = require("./dogModel");

const Schema = mongoose.Schema;

// signup code -> team. Not 1:1 with TEAMS in helpers/teams.js since a code
// can read differently than the team value it maps to (e.g. "DZIKIEGZIKI" -> "DZIKIE_GZIKI").
const teamCodeMap = {
  DZIKIEGZIKI: "DZIKIE_GZIKI",
  FLYVENGERS: "FLYVENGERS",
  DZIKIE_GZIKI_NABOR: "DZIKIE_GZIKI_NABOR",
  WEST_SIDE_DOGZ: "WEST_SIDE_DOGZ",
  TEST: "TEST_TEAM",
};

const getTeamFromTeamCode = (teamCode) => teamCodeMap[teamCode];

const userSchema = new Schema(
  {
    dogs: {
      type: [DogModel.schema],
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: { type: [{ type: String }] },
    team: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

userSchema.statics.signup = async function (email, password, name, teamCode) {
  // TODO:
  // if (!teamCode)

  if (!email || !password) {
    throw Error("ALL_FIELDS_MUST_BE_FILLED");
  }

  const exists = await this.findOne({ email });

  if (exists) {
    throw Error("EMAIL_ALREADY_IN_USE");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({
    email,
    password: hash,
    name,
    roles: [],
    team: getTeamFromTeamCode(teamCode ?? ""),
  });

  return user;
};

userSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    throw Error("ALL_FIELDS_MUST_BE_FILLED");
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw Error("INCORRECT_EMAIL");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw Error("INCORRECT_PASSWORD");
  }

  return user;
};

module.exports = mongoose.model("User", userSchema);
