import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import webpush from "web-push";
import pushSubscriptionControllerModule from "./pushSubscriptionController.js";
import testHelpersModule from "../testHelpers.js";

const { subscribe, unsubscribe, sendTestNotification } = pushSubscriptionControllerModule;
const PushSubscriptionModel = mongoose.model("PushSubscription");
const UserModel = mongoose.model("User");
const { mockRes } = testHelpersModule;

const CLUB = "TEST_TEAM";
const USER_ID = new mongoose.Types.ObjectId().toString();

const KEYS = { p256dh: "p256dh-key", auth: "auth-key" };

describe("subscribe", () => {
  it("creates a subscription scoped to the caller", async () => {
    const res = mockRes();

    await subscribe(
      { club: CLUB, userId: USER_ID, body: { endpoint: "https://push.example.com/a", keys: KEYS } },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.userId).toBe(USER_ID);
    expect(res.body.team).toBe(CLUB);

    const stored = await PushSubscriptionModel.findOne({ endpoint: "https://push.example.com/a" });
    expect(stored.userId).toBe(USER_ID);
  });

  it("upserts in place on the same endpoint with different keys, instead of duplicating", async () => {
    await subscribe(
      { club: CLUB, userId: USER_ID, body: { endpoint: "https://push.example.com/b", keys: KEYS } },
      mockRes()
    );

    const newKeys = { p256dh: "new-p256dh", auth: "new-auth" };

    await subscribe(
      { club: CLUB, userId: USER_ID, body: { endpoint: "https://push.example.com/b", keys: newKeys } },
      mockRes()
    );

    const matching = await PushSubscriptionModel.find({ endpoint: "https://push.example.com/b" });
    expect(matching).toHaveLength(1);
    expect(matching[0].keys.p256dh).toBe("new-p256dh");
  });
});

describe("sendTestNotification", () => {
  beforeEach(() => {
    vi.spyOn(webpush, "sendNotification").mockResolvedValue({ statusCode: 201 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends only to the caller's own subscription, not other club members", async () => {
    const user = await UserModel.create({
      name: "Caller",
      email: "caller@example.com",
      password: "hash",
      team: CLUB,
      language: "en",
    });
    const otherUserId = new mongoose.Types.ObjectId().toString();

    await PushSubscriptionModel.create({
      endpoint: "https://push.example.com/caller",
      keys: KEYS,
      userId: user._id.toString(),
      team: CLUB,
    });
    await PushSubscriptionModel.create({
      endpoint: "https://push.example.com/other",
      keys: KEYS,
      userId: otherUserId,
      team: CLUB,
    });

    const res = mockRes();
    await sendTestNotification({ club: CLUB, userId: user._id.toString() }, res);

    expect(res.statusCode).toBe(200);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    expect(webpush.sendNotification.mock.calls[0][0].endpoint).toBe("https://push.example.com/caller");
  });
});

describe("unsubscribe", () => {
  it("only ever deletes the caller's own subscription", async () => {
    const otherUserId = new mongoose.Types.ObjectId().toString();

    await PushSubscriptionModel.create({
      endpoint: "https://push.example.com/mine",
      keys: KEYS,
      userId: USER_ID,
      team: CLUB,
    });

    await PushSubscriptionModel.create({
      endpoint: "https://push.example.com/theirs",
      keys: KEYS,
      userId: otherUserId,
      team: CLUB,
    });

    // Attempting to unsubscribe someone else's endpoint under our own userId - no-op.
    await unsubscribe(
      { userId: USER_ID, params: { endpoint: encodeURIComponent("https://push.example.com/theirs") } },
      mockRes()
    );

    expect(await PushSubscriptionModel.findOne({ endpoint: "https://push.example.com/theirs" })).not.toBeNull();

    await unsubscribe(
      { userId: USER_ID, params: { endpoint: encodeURIComponent("https://push.example.com/mine") } },
      mockRes()
    );

    expect(await PushSubscriptionModel.findOne({ endpoint: "https://push.example.com/mine" })).toBeNull();
  });
});
