const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const pushSubscriptionSchema = new Schema(
  {
    // Unique so re-subscribing (e.g. after a browser-issued key rotation)
    // upserts the existing row instead of erroring on a duplicate.
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    // Not unique - one user can have several devices/browsers subscribed.
    userId: { type: String, required: true },
    team: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
