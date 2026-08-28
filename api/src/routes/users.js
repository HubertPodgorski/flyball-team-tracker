const express = require("express");

const router = express.Router();

const { login, logout, signup } = require("../controllers/userController");

// login
router.post("/login", login);

// logout
router.post("/logout", logout);

// signup
router.post("/signup", signup);

module.exports = router;
