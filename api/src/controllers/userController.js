const UserModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const createToken = (_id, team) => {
  return jwt.sign({ _id, team }, process.env.SECRET, { expiresIn: "3d" });
};

// get all users
const getAllUsers = async (callback, userToken) => {
  const { team } = jwt.decode(userToken);

  const users = await UserModel.find({ team }).sort({ createdAt: -1 });

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
    { new: true }
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
  const { email, password, team } = req.body;

  try {
    const user = await UserModel.login(email, password);

    let teamToSet = email === "SUPERADMIN" && team ? team : user.team;

    const token = createToken(user._id, teamToSet);

    res.status(200).json({ user, token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

const logout = async (req, res) => {};

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
};
