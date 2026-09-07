const UserModel = require("../models/userModel");

// Super-admins aren't real members of any club - keep them out of every
// club's user list. Shared by userController, dogCascade, and the push code.
const findClubUsers = (club) =>
  UserModel.find({ team: club, roles: { $nin: ["SUPER_ADMIN"] } }).sort({
    createdAt: -1,
  });

module.exports = { findClubUsers };
