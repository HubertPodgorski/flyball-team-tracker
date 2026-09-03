const UserModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { CLUBS } = require("../helpers/teams");
const { broadcast } = require("../sse");

const createToken = (_id, club) => {
  return jwt.sign({ _id, club }, process.env.SECRET, { expiresIn: "3d" });
};

// Super-admins aren't real members of any club - keep them out of every club's user list.
const findClubUsers = (club) =>
  UserModel.find({ team: club, roles: { $nin: ["SUPER_ADMIN"] } }).sort({
    createdAt: -1,
  });

const getUsers = async (req, res) => {
  const users = await findClubUsers(req.club);

  res.status(200).json(users);
};

const updateUser = async (req, res) => {
  const { _id, ...data } = req.body;

  const user = await UserModel.findOneAndUpdate(
    { _id, team: req.club },
    { ...data, team: req.club },
    { returnDocument: "after" }
  );

  if (!user) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  res.status(200).json(user);
  broadcast(req.club, "users_updated", await findClubUsers(req.club));
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  await UserModel.findOneAndDelete({ _id: id, team: req.club });

  res.status(200).json({ ok: true });
  broadcast(req.club, "users_updated", await findClubUsers(req.club));
};

// Trainer resets a teammate's password (no email flow yet - see
// userModel.js's resetPasswordForUser) - club-scoped like every other
// club-management action here. The temporary password is returned once, in
// this response only; it's never broadcast or persisted anywhere in plain
// text, so the trainer must relay it to the member immediately.
const resetUserPassword = async (req, res) => {
  const { id } = req.params;

  const target = await UserModel.findOne({ _id: id, team: req.club });

  if (!target) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  const { temporaryPassword } = await UserModel.resetPasswordForUser(id);

  res.status(200).json({ temporaryPassword });
};

// Self-service: the logged-in user changes their own password.
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    await UserModel.changeOwnPassword(req.userId, currentPassword, newPassword);

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.login(email, password);

    const token = createToken(user._id, user.team);

    res.status(200).json({ user, token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

const logout = async (req, res) => {};

// super-admin only: mint a new token scoped to a different club, without
// changing the super-admin's own `team` field in the DB. The frontend swaps
// the token and reconnects - every existing club-scoped screen then just
// works as if logged in as that club. Body key stays `team` on the wire.
const switchClub = async (req, res) => {
  const { token, team: club } = req.body;

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.SECRET);
  } catch (e) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }

  if (!CLUBS.includes(club)) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }

  const user = await UserModel.findById(decoded._id);

  if (!user || !user.roles?.includes("SUPER_ADMIN")) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const newToken = createToken(user._id, club);

  res.status(200).json({ user, token: newToken });
};

const signup = async (req, res) => {
  const { email, password, name, teamCode } = req.body;

  try {
    const user = await UserModel.signup(email, password, name, teamCode);

    const token = createToken(user._id, user.team);

    res.status(200).json({ user, token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Public (no decodeToken) - the signup form needs this before a token exists.
// Single source of truth for valid signup codes, shared by both deployments
// (frontend on Vercel, backend on Heroku) without either hardcoding its own
// copy - see userModel.js's getValidTeamCodes.
const getClubCodes = async (req, res) => {
  res.status(200).json(UserModel.getValidTeamCodes());
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  resetUserPassword,
  changePassword,
  login,
  logout,
  signup,
  switchClub,
  getClubCodes,
};
