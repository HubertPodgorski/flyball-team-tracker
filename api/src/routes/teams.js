const express = require("express");
const decodeToken = require("../middleware/decodeToken");
const {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");

const router = express.Router();

router.use(decodeToken);

router.get("/", getTeams);
router.post("/", createTeam);
router.patch("/", updateTeam);
router.delete("/:id", deleteTeam);

module.exports = router;
