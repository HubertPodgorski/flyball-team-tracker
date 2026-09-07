import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import webpush from "web-push";
import { sendPushToMembers } from "./push.js";

const PushSubscriptionModel = mongoose.model("PushSubscription");
const CLUB = "TEST_TEAM";

const makeSubscription = (userId, overrides = {}) =>
  PushSubscriptionModel.create({
    endpoint: `https://push.example.com/${userId}`,
    keys: { p256dh: "p256dh-key", auth: "auth-key" },
    userId,
    team: CLUB,
    ...overrides,
  });

beforeEach(() => {
  vi.spyOn(webpush, "sendNotification").mockResolvedValue({ statusCode: 201 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendPushToMembers", () => {
  it("sends a localized payload per recipient's own language", async () => {
    const plUserId = new mongoose.Types.ObjectId().toString();
    const enUserId = new mongoose.Types.ObjectId().toString();

    await makeSubscription(plUserId);
    await makeSubscription(enUserId);

    await sendPushToMembers(
      CLUB,
      [
        { _id: plUserId, language: "pl" },
        { _id: enUserId, language: "en" },
      ],
      "newEvent",
      "Training"
    );

    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);

    const payloadFor = (userId) => {
      const call = webpush.sendNotification.mock.calls.find(
        ([subscription]) => subscription.endpoint === `https://push.example.com/${userId}`
      );

      return JSON.parse(call[1]);
    };

    expect(payloadFor(plUserId).title).toBe("Nowe wydarzenie");
    expect(payloadFor(enUserId).title).toBe("New event");
  });

  it("skips a member with no subscribed device, without erroring", async () => {
    const unsubscribedUserId = new mongoose.Types.ObjectId().toString();

    await expect(
      sendPushToMembers(CLUB, [{ _id: unsubscribedUserId, language: "en" }], "newEvent", "Training")
    ).resolves.not.toThrow();

    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it.each([404, 410])(
    "prunes the subscription when the push service reports it dead (%i)",
    async (statusCode) => {
      const userId = new mongoose.Types.ObjectId().toString();
      const subscription = await makeSubscription(userId);

      const error = Object.assign(new Error("gone"), { statusCode });
      webpush.sendNotification.mockRejectedValueOnce(error);

      await sendPushToMembers(CLUB, [{ _id: userId, language: "en" }], "newEvent", "Training");

      expect(await PushSubscriptionModel.findById(subscription._id)).toBeNull();
    }
  );

  it("keeps a subscription and still sends to the rest on a non-dead-endpoint error", async () => {
    const failingUserId = new mongoose.Types.ObjectId().toString();
    const okUserId = new mongoose.Types.ObjectId().toString();

    const failingSubscription = await makeSubscription(failingUserId);
    await makeSubscription(okUserId);

    const error = Object.assign(new Error("server error"), { statusCode: 500 });
    webpush.sendNotification.mockImplementation((subscription) =>
      subscription.endpoint === failingSubscription.endpoint
        ? Promise.reject(error)
        : Promise.resolve({ statusCode: 201 })
    );

    await sendPushToMembers(
      CLUB,
      [
        { _id: failingUserId, language: "en" },
        { _id: okUserId, language: "en" },
      ],
      "newEvent",
      "Training"
    );

    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    expect(await PushSubscriptionModel.findById(failingSubscription._id)).not.toBeNull();
  });
});
