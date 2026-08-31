const UserModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { TEAMS } = require("../helpers/teams");

const createToken = (_id, team) => {
  return jwt.sign({ _id, team }, process.env.SECRET, { expiresIn: "3d" });
};

// get all users
const getAllUsers = async (callback, userToken) => {
  const { team } = jwt.decode(userToken);

  // super-admins are not real members of any team - keep them out of every
  // team's user list, including their own home team's.
  const users = await UserModel.find({
    team,
    roles: { $nin: ["SUPER_ADMIN"] },
  }).sort({ createdAt: -1 });

  callback(users);
};

// get single user
const getUserById = async (received, callback) => {
  const { _id } = received;

  // TODO: handle that
  // if (!mongoose.Types.ObjectId.isValid(_id)) {
  //   return res.status(404).json({ error: "USER_NOT_FOUND" });
  // }

  const user = await UserModel.findById(_id);

  // TODO: handle that
  // if (!user) {
  //   return res.status(404).json({ error: "USER_NOT_FOUND" });
  // }

  callback(user);
};

// create new user
const createUser = (received, callback, io, userToken) => async (req, res) => {
  const { team } = jwt.decode(userToken);

  const { name, dogs } = received;

  const user = await UserModel.create({ name, dogs, team });

  const allUsers = await UserModel.find({ team });

  callback(user);
  io.to(team).emit("users_updated", allUsers);
};

// delete user
const deleteUserById = async (received, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { _id } = received;

  // TODO: handle that
  // if (!mongoose.Types.ObjectId.isValid(_id)) {
  //   return res.status(404).json({ error: "USER_NOT_FOUND" });
  // }

  await UserModel.findOneAndDelete({ _id });

  // TODO: handle that
  // if (!user) {
  //   return res.status(400).json({ error: "USER_NOT_FOUND" });
  // }

  const allUsers = await UserModel.find({ team });

  io.to(team).emit("users_updated", allUsers);
};

// update user
const updateUserById = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { _id } = received;

  // TODO: handle that
  // if (!mongoose.Types.ObjectId.isValid(_id)) {
  //   return res.status(404).json({ error: "USER_NOT_FOUND" });
  // }

  const user = await UserModel.findOneAndUpdate(
    { _id },
    { ...received, team },
    { returnDocument: "after" }
  );

  // TODO: handle that
  // if (!user) {
  //   return res.status(404).json({ error: "USER_NOT_FOUND" });
  // }

  const allUsers = await UserModel.find({ team });

  callback(user);
  io.to(team).emit("users_updated", allUsers);
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

// super-admin only: mint a new token scoped to a different team, without
// changing the super-admin's own `team` field in the DB. The frontend swaps
// the token and reconnects the socket - every existing team-scoped screen
// then just works as if logged in as that team.
const switchTeam = async (req, res) => {
  const { token, team } = req.body;

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.SECRET);
  } catch (e) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }

  if (!TEAMS.includes(team)) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }

  const user = await UserModel.findById(decoded._id);

  if (!user || !user.roles?.includes("SUPER_ADMIN")) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const newToken = createToken(user._id, team);

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

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  deleteUserById,
  updateUserById,
  login,
  logout,
  signup,
  switchTeam,
};
