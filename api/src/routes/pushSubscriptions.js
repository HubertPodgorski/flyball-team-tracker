const express = require("express");
const decodeToken = require("../middleware/decodeToken");
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  sendTestNotification,
} = require("../controllers/pushSubscriptionController");

const router = express.Router();

router.use(decodeToken);

router.get("/vapid-public-key", getVapidPublicKey);
router.post("/", subscribe);
router.delete("/:endpoint", unsubscribe);
router.post("/test", sendTestNotification);

module.exports = router;
