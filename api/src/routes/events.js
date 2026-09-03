const express = require("express");
const decodeToken = require("../middleware/decodeToken");
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventDog,
  toggleEventUser,
} = require("../controllers/eventController");

const router = express.Router();

router.use(decodeToken);

router.get("/", getEvents);
router.post("/", createEvent);
router.patch("/", updateEvent);
router.delete("/:id", deleteEvent);
router.patch("/:id/dogs/:dogId/toggle", toggleEventDog);
router.patch("/:id/users/:userId/toggle", toggleEventUser);

module.exports = router;
