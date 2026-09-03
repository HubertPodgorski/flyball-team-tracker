const express = require("express");
const decodeToken = require("../middleware/decodeToken");
const {
  getDogTasks,
  createDogTask,
  updateDogTask,
  deleteDogTask,
} = require("../controllers/dogTaskController");

const router = express.Router();

router.use(decodeToken);

router.get("/", getDogTasks);
router.post("/", createDogTask);
router.patch("/", updateDogTask);
router.delete("/:id", deleteDogTask);

module.exports = router;
