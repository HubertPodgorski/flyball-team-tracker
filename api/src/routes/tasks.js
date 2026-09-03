const express = require("express");
const decodeToken = require("../middleware/decodeToken");
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} = require("../controllers/taskController");

const router = express.Router();

router.use(decodeToken);

router.get("/", getTasks);
router.post("/", createTask);
router.patch("/", updateTask);
router.delete("/:id", deleteTask);
router.patch("/reorder", reorderTasks);

module.exports = router;
