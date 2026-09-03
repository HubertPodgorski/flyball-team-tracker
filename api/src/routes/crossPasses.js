const express = require("express");
const decodeToken = require("../middleware/decodeToken");
const {
  getCrossPasses,
  createCrossPass,
  updateCrossPass,
  deleteCrossPass,
} = require("../controllers/crossPassController");

const router = express.Router();

router.use(decodeToken);

router.get("/", getCrossPasses);
router.post("/", createCrossPass);
router.patch("/", updateCrossPass);
router.delete("/:id", deleteCrossPass);

module.exports = router;
