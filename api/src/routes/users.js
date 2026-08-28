const express = require("express");

const router = express.Router();

const {
  login,
  logout,
  signup,
  switchTeam,
} = require("../controllers/userController");

// login
router.post("/login", login);

// logout
router.post("/logout", logout);

// signup
router.post("/signup", signup);

// super-admin: switch active team
router.post("/switch-team", switchTeam);

module.exports = router;
