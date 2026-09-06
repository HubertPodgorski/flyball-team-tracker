const express = require("express");
const decodeToken = require("../middleware/decodeToken");
const {
  getResources,
  createResource,
  updateResource,
  deleteResource,
} = require("../controllers/resourceController");

const router = express.Router();

router.use(decodeToken);

router.get("/", getResources);
router.post("/", createResource);
router.patch("/", updateResource);
router.delete("/:id", deleteResource);

module.exports = router;
