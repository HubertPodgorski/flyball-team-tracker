const webpush = require("web-push");
const PushSubscriptionModel = require("../models/pushSubscriptionModel");
const { buildPushPayload } = require("./pushI18n");

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// `members` is {_id, language}[], not bare ids - language picks the
// payload text, since a subscription row carries no locale of its own.
const sendPushToMembers = async (club, members, messageKey, ...args) => {
  const languageByUserId = new Map(members.map((member) => [member._id.toString(), member.language]));

  const subscriptions = await PushSubscriptionModel.find({
    team: club,
    userId: { $in: [...languageByUserId.keys()] },
  });

  // TEMP DEBUG - remove once the prod push mystery is solved.
  console.log("SEND-PUSH-TO-MEMBERS DEBUG", {
    club,
    messageKey,
    vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    memberIds: [...languageByUserId.keys()],
    subscriptionsFoundCount: subscriptions.length,
    subscriptionUserIds: subscriptions.map((s) => s.userId),
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const payload = buildPushPayload(languageByUserId.get(subscription.userId), messageKey, ...args);

      try {
        const result = await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: subscription.keys },
          JSON.stringify(payload)
        );

        // TEMP DEBUG - remove once the prod push mystery is solved.
        console.log("PUSH SEND SUCCESS", {
          userId: subscription.userId,
          statusCode: result?.statusCode,
        });
      } catch (error) {
        // 404/410 = the push service says this subscription is dead
        // (revoked/uninstalled) - prune it so nothing retries it forever.
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscriptionModel.findByIdAndDelete(subscription._id);
        } else {
          console.error("Push send failed:", error.statusCode, error.body, error.message);
        }
      }
    })
  );
};

module.exports = { sendPushToMembers };
