const express = require("express");
const decodeToken = require("../middleware/decodeToken");
const {
  getSquads,
  createSquad,
  updateSquad,
  deleteSquad,
} = require("../controllers/squadController");

const router = express.Router();

router.use(decodeToken);

router.get("/", getSquads);
router.post("/", createSquad);
router.patch("/", updateSquad);
router.delete("/:id", deleteSquad);

module.exports = router;
