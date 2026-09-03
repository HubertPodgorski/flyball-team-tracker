const express = require("express");
const decodeToken = require("../middleware/decodeToken");
const {
  getDogs,
  createDog,
  updateDog,
  deleteDog,
} = require("../controllers/dogController");

const router = express.Router();

router.use(decodeToken);

router.get("/", getDogs);
router.post("/", createDog);
router.patch("/", updateDog);
router.delete("/:id", deleteDog);

module.exports = router;
