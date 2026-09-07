import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import webpush from "web-push";

import eventControllerModule from "./eventController.js";
import testHelpersModule from "../testHelpers.js";

const { createEvent, sendEventReminder } = eventControllerModule;
const { mockRes } = testHelpersModule;
const UserModel = mongoose.model("User");
const EventModel = mongoose.model("Event");
const PushSubscriptionModel = mongoose.model("PushSubscription");

const CLUB = "TEST_TEAM";

const makeUser = (overrides = {}) =>
  UserModel.create({
    name: "Member",
    email: `member-${new mongoose.Types.ObjectId()}@example.com`,
    password: "hashed",
    roles: [],
    team: CLUB,
    ...overrides,
  });

const makeSubscription = (user) =>
  PushSubscriptionModel.create({
    endpoint: `https://push.example.com/${user._id}`,
    keys: { p256dh: "p256dh-key", auth: "auth-key" },
    userId: user._id.toString(),
    team: CLUB,
  });

// Fire-and-forget, with two real DB round trips before it reaches webpush -
// poll instead of guessing a fixed delay.
const waitForPush = () => vi.waitFor(() => expect(webpush.sendNotification).toHaveBeenCalled());

beforeEach(() => {
  // See reminderScheduler.integration.test.js for why this spy (not vi.mock) is needed.
  vi.spyOn(webpush, "sendNotification").mockResolvedValue({ statusCode: 201 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createEvent", () => {
  it("pushes to every club member except the creator", async () => {
    const creator = await makeUser({ name: "Creator" });
    const other = await makeUser({ name: "Other" });
    await makeSubscription(creator);
    await makeSubscription(other);

    const res = mockRes();

    await createEvent(
      { club: CLUB, userId: creator._id.toString(), body: { name: "Training", date: "2026-01-01", type: "TRAINING" } },
      res
    );
    await waitForPush();

    expect(res.statusCode).toBe(200);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);

    const [subscription, payload] = webpush.sendNotification.mock.calls[0];
    expect(subscription.endpoint).toBe(`https://push.example.com/${other._id}`);
    const parsed = JSON.parse(payload);
    expect(parsed.body).toBe("Training");
    // Carries the event id through so a notification click can deep-link to it.
    expect(parsed.eventId).toBe(res.body._id.toString());
  });

  it("excludes a super-admin from the recipient list", async () => {
    const creator = await makeUser({ name: "Creator" });
    const superAdmin = await makeUser({ name: "Super Admin", roles: ["SUPER_ADMIN"] });
    const regular = await makeUser({ name: "Regular" });
    await makeSubscription(creator);
    await makeSubscription(superAdmin);
    await makeSubscription(regular);

    const res = mockRes();

    await createEvent(
      { club: CLUB, userId: creator._id.toString(), body: { name: "Comp", date: "2026-01-01", type: "COMPETITION" } },
      res
    );
    await waitForPush();

    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    const [subscription] = webpush.sendNotification.mock.calls[0];
    expect(subscription.endpoint).toBe(`https://push.example.com/${regular._id}`);
  });
});

describe("sendEventReminder", () => {
  it("triggers the shared reminder logic for the caller's own club event", async () => {
    const unmarked = await makeUser();
    await makeSubscription(unmarked);

    const event = await EventModel.create({
      name: "Manual trigger",
      date: "2026-01-01",
      type: "TRAINING",
      team: CLUB,
    });

    const res = mockRes();

    await sendEventReminder({ club: CLUB, params: { id: event._id.toString() } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ remindedCount: 1 });
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);

    const stored = await EventModel.findById(event._id);
    expect(stored.reminderSentAt).toBeInstanceOf(Date);
  });

  it("refuses to trigger a reminder for another club's event", async () => {
    const event = await EventModel.create({
      name: "Other club's event",
      date: "2026-01-01",
      type: "TRAINING",
      team: "FLYVENGERS",
    });

    const res = mockRes();

    await sendEventReminder({ club: CLUB, params: { id: event._id.toString() } }, res);

    expect(res.statusCode).toBe(404);
    expect(webpush.sendNotification).not.toHaveBeenCalled();

    const stored = await EventModel.findById(event._id);
    expect(stored.reminderSentAt).toBeUndefined();
  });
});
