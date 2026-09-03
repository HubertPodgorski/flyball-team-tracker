const express = require("express");
const decodeToken = require("../middleware/decodeToken");

const router = express.Router();

const {
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
} = require("../controllers/userController");

// login
router.post("/login", login);

// logout
router.post("/logout", logout);

// signup
router.post("/signup", signup);

// public: valid signup club codes (see userController.getClubCodes)
router.get("/club-codes", getClubCodes);

// super-admin: switch active club
router.post("/switch-team", switchClub);

// club-scoped user management - decodeToken only on these, not the public auth routes above.
// No POST here: signup is the only way a user account is ever created (see
// signup above) - there used to be a second, club-scoped creation endpoint
// but nothing in the UI ever called it (trainer-panel has no "add user"
// button, and super-admin's grid explicitly disables Add for this entity),
// and it couldn't have worked anyway: it never supplied the email/password
// the schema requires, so hitting it would always 500.
router.get("/", decodeToken, getUsers);
router.patch("/", decodeToken, updateUser);
router.delete("/:id", decodeToken, deleteUser);

// Self-service password change (any logged-in user, their own account only).
router.patch("/change-password", decodeToken, changePassword);

// Trainer resets a teammate's password within their own club.
router.patch("/:id/reset-password", decodeToken, resetUserPassword);

module.exports = router;
