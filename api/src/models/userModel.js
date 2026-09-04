const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const DogModel = require("./dogModel");

const Schema = mongoose.Schema;

// signup code -> team. Not 1:1 with CLUBS in helpers/teams.js since a code
// can read differently than the team value it maps to (e.g. "DZIKIEGZIKI" -> "DZIKIE_GZIKI").
const teamCodeMap = {
  DZIKIEGZIKI: "DZIKIE_GZIKI",
  FLYVENGERS: "FLYVENGERS",
  DZIKIE_GZIKI_NABOR: "DZIKIE_GZIKI_NABOR",
  WEST_SIDE_DOGZ: "WEST_SIDE_DOGZ",
  TEST: "TEST_TEAM",
  ULTRA_FLYBALL_TEAM: "ULTRA_FLYBALL_TEAM",
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
    language: { type: String, enum: ["en", "pl"], default: "pl" },
  },
  {
    timestamps: true,
    // Every response that ever sends a User document to the client - login,
    // signup, the club's user list, the users_updated SSE broadcast, the
    // super-admin grid - was sending the bcrypt hash right along with it,
    // completely unnoticed since nothing in the UI ever displayed it.
    // res.json() serializes Mongoose documents through toJSON(), so this one
    // change closes every one of those call sites at once instead of
    // patching each individually (and any future one that forgets to).
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.statics.signup = async function (email, password, name, teamCode) {
  if (!email || !password) {
    throw Error("ALL_FIELDS_MUST_BE_FILLED");
  }

  const exists = await this.findOne({ email });

  if (exists) {
    throw Error("EMAIL_ALREADY_IN_USE");
  }

  const team = getTeamFromTeamCode(teamCode ?? "");

  // An unrecognized code used to fall through silently, creating a user
  // with no club at all - a real account nothing ever surfaced as broken
  // until they wondered why every page came up empty.
  if (!team) {
    throw Error("INVALID_CLUB_CODE");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({
    email,
    password: hash,
    name,
    roles: [],
    team,
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

// Self-service: the logged-in user changes their own password, proving they
// still know the current one first.
userSchema.statics.changeOwnPassword = async function (
  userId,
  currentPassword,
  newPassword
) {
  if (!currentPassword || !newPassword) {
    throw Error("ALL_FIELDS_MUST_BE_FILLED");
  }

  const user = await this.findById(userId);

  if (!user) {
    throw Error("INCORRECT_EMAIL");
  }

  const match = await bcrypt.compare(currentPassword, user.password);

  if (!match) {
    throw Error("INCORRECT_PASSWORD");
  }

  const salt = await bcrypt.genSalt(10);

  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return user;
};

// A random, readable-enough temporary password - not shown to the user
// choosing it, so entropy matters more than memorability. Trainer/super-admin
// relay this to the member out-of-band (see resetPasswordForUser callers);
// there's no email flow yet (see Settings.tsx / trainer-panel/Users.jsx).
const generateTemporaryPassword = () => crypto.randomBytes(9).toString("base64url");

// Trainer (own club) or super-admin (any club) reset - the caller is
// responsible for its own authorization/scoping before calling this.
userSchema.statics.resetPasswordForUser = async function (userId) {
  const temporaryPassword = generateTemporaryPassword();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(temporaryPassword, salt);

  const user = await this.findByIdAndUpdate(
    userId,
    { password: hash },
    { returnDocument: "after" }
  );

  if (!user) {
    throw Error("NOT_FOUND");
  }

  return { user, temporaryPassword };
};

module.exports = mongoose.model("User", userSchema);

// The single source of truth for which club codes are valid at signup - the
// frontend used to keep its own separate hardcoded copy of this list for
// client-side validation, which could silently drift from this one (add a
// club here and forget there, or vice versa). Exposed read-only via
// GET /users/club-codes instead.
module.exports.getValidTeamCodes = () => Object.keys(teamCodeMap);
