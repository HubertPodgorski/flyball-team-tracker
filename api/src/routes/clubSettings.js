const express = require("express");
const decodeToken = require("../middleware/decodeToken");
const {
  getClubSettings,
  updateClubSettings,
} = require("../controllers/clubSettingsController");

const router = express.Router();

router.use(decodeToken);

router.get("/", getClubSettings);
router.patch("/", updateClubSettings);

module.exports = router;
