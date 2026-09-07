const PushSubscriptionModel = require("../models/pushSubscriptionModel");
const UserModel = require("../models/userModel");
const { sendPushToMembers } = require("../helpers/push");

const getVapidPublicKey = async (req, res) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

const subscribe = async (req, res) => {
  const { endpoint, keys } = req.body;

  const subscription = await PushSubscriptionModel.findOneAndUpdate(
    { endpoint },
    { endpoint, keys, userId: req.userId, team: req.club },
    { upsert: true, returnDocument: "after" }
  );

  res.status(200).json(subscription);
};

// Scoped to the caller's own userId - never lets one user delete another's
// subscription by guessing/enumerating an endpoint.
const unsubscribe = async (req, res) => {
  const { endpoint } = req.params;

  await PushSubscriptionModel.findOneAndDelete({
    endpoint: decodeURIComponent(endpoint),
    userId: req.userId,
  });

  res.status(200).json({ ok: true });
};

// Scoped to the caller's own subscriptions - lets a user self-diagnose a dead push setup.
const sendTestNotification = async (req, res) => {
  const user = await UserModel.findById(req.userId);
  await sendPushToMembers(req.club, [{ _id: req.userId, language: user?.language }], "testNotification");
  res.status(200).json({ ok: true });
};

module.exports = { getVapidPublicKey, subscribe, unsubscribe, sendTestNotification };
