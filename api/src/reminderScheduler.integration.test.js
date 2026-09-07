import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import webpush from "web-push";

import reminderSchedulerModule from "./reminderScheduler.js";

const { sendReminderForEvent, sendAttendanceReminders, startReminderScheduler } = reminderSchedulerModule;
const EventModel = mongoose.model("Event");
const UserModel = mongoose.model("User");
const PushSubscriptionModel = mongoose.model("PushSubscription");

const HOUR_MS = 60 * 60 * 1000;
const CLUB = "TEST_TEAM";

const hoursFromNow = (hours) => new Date(Date.now() + hours * HOUR_MS).toISOString();

const makeUser = (overrides = {}) =>
  UserModel.create({
    name: "Member",
    email: `member-${new mongoose.Types.ObjectId()}@example.com`,
    password: "hashed",
    roles: [],
    team: CLUB,
    ...overrides,
  });

// Without a real subscription doc, "not called" would be true regardless
// of whether the recipient logic is actually right.
const makeSubscription = (user, club = CLUB) =>
  PushSubscriptionModel.create({
    endpoint: `https://push.example.com/${user._id}`,
    keys: { p256dh: "p256dh-key", auth: "auth-key" },
    userId: user._id.toString(),
    team: club,
  });

beforeEach(() => {
  // vi.mock doesn't reach this codebase's CJS require() chains - spy on the
  // real web-push singleton instead (push.js calls it via property access).
  vi.spyOn(webpush, "sendNotification").mockResolvedValue({ statusCode: 201 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendAttendanceReminders", () => {
  it("reminds only unmarked members for an event ~24h away, and sets reminderSentAt", async () => {
    const unmarked = await makeUser({ name: "Unmarked" });
    const marked = await makeUser({ name: "Marked" });
    await makeSubscription(unmarked);
    await makeSubscription(marked);

    const event = await EventModel.create({
      name: "Training",
      date: hoursFromNow(24),
      type: "TRAINING",
      team: CLUB,
      users: [{ _id: marked._id.toString(), status: "PRESENT" }],
    });

    await sendAttendanceReminders();

    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    const [subscription, payload] = webpush.sendNotification.mock.calls[0];
    expect(subscription.endpoint).toBe(`https://push.example.com/${unmarked._id}`);
    // Carries the event id through so a notification click can deep-link to it.
    expect(JSON.parse(payload).eventId).toBe(event._id.toString());

    const stored = await EventModel.findById(event._id);
    expect(stored.reminderSentAt).toBeInstanceOf(Date);
  });

  it("does not send when everyone is already marked, but still sets reminderSentAt", async () => {
    const marked = await makeUser({ name: "Marked" });
    await makeSubscription(marked);

    const event = await EventModel.create({
      name: "Fully Marked",
      date: hoursFromNow(24),
      type: "TRAINING",
      team: CLUB,
      users: [{ _id: marked._id.toString(), status: "ABSENT" }],
    });

    await sendAttendanceReminders();

    expect(webpush.sendNotification).not.toHaveBeenCalled();

    const stored = await EventModel.findById(event._id);
    expect(stored.reminderSentAt).toBeInstanceOf(Date);
  });

  it("skips events outside the 23h-25h window, leaving reminderSentAt unset", async () => {
    const member = await makeUser();
    await makeSubscription(member);

    const soon = await EventModel.create({
      name: "Too soon",
      date: hoursFromNow(10),
      type: "TRAINING",
      team: CLUB,
    });

    const far = await EventModel.create({
      name: "Too far",
      date: hoursFromNow(40),
      type: "TRAINING",
      team: CLUB,
    });

    await sendAttendanceReminders();

    expect(webpush.sendNotification).not.toHaveBeenCalled();
    expect((await EventModel.findById(soon._id)).reminderSentAt).toBeUndefined();
    expect((await EventModel.findById(far._id)).reminderSentAt).toBeUndefined();
  });

  it("skips a malformed date without throwing, and still processes other eligible events", async () => {
    const member = await makeUser();
    await makeSubscription(member);

    const malformed = await EventModel.create({
      name: "Bad date",
      date: "not-a-real-date",
      type: "TRAINING",
      team: CLUB,
    });

    const good = await EventModel.create({
      name: "Good date",
      date: hoursFromNow(24),
      type: "TRAINING",
      team: CLUB,
    });

    await expect(sendAttendanceReminders()).resolves.not.toThrow();

    expect((await EventModel.findById(malformed._id)).reminderSentAt).toBeUndefined();
    expect((await EventModel.findById(good._id)).reminderSentAt).toBeInstanceOf(Date);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
  });

  it("does not leak members across clubs", async () => {
    const clubAUser = await makeUser({ team: "TEST_TEAM" });
    const clubBUser = await makeUser({ team: "FLYVENGERS" });
    await makeSubscription(clubAUser, "TEST_TEAM");
    await makeSubscription(clubBUser, "FLYVENGERS");

    await EventModel.create({
      name: "Club A event",
      date: hoursFromNow(24),
      type: "TRAINING",
      team: "TEST_TEAM",
    });

    await EventModel.create({
      name: "Club B event",
      date: hoursFromNow(24),
      type: "TRAINING",
      team: "FLYVENGERS",
    });

    await sendAttendanceReminders();

    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);

    const calledEndpoints = webpush.sendNotification.mock.calls
      .map(([subscription]) => subscription.endpoint)
      .sort();

    expect(calledEndpoints).toEqual(
      [`https://push.example.com/${clubAUser._id}`, `https://push.example.com/${clubBUser._id}`].sort()
    );
  });

  it("never re-fires for the same event across repeated calls (dedup)", async () => {
    const member = await makeUser();
    await makeSubscription(member);

    await EventModel.create({
      name: "Once only",
      date: hoursFromNow(24),
      type: "TRAINING",
      team: CLUB,
    });

    await sendAttendanceReminders();
    await sendAttendanceReminders();

    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
  });

  it("excludes an event whose reminderSentAt is already set, even if still inside the window", async () => {
    const member = await makeUser();
    await makeSubscription(member);

    await EventModel.create({
      name: "Already sent",
      date: hoursFromNow(24),
      type: "TRAINING",
      team: CLUB,
      reminderSentAt: new Date(),
    });

    await sendAttendanceReminders();

    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });
});

describe("startReminderScheduler", () => {
  it("runs a check immediately on startup, not only after the first hour ticks", async () => {
    const findSpy = vi.spyOn(EventModel, "find");

    vi.useFakeTimers();
    startReminderScheduler();
    await vi.advanceTimersByTimeAsync(0);
    vi.useRealTimers();

    expect(findSpy).toHaveBeenCalled();
  });
});

describe("sendReminderForEvent (manual trigger path)", () => {
  it("returns the count of members reminded, and sets reminderSentAt regardless of timing", async () => {
    const unmarked = await makeUser();
    await makeSubscription(unmarked);

    const event = await EventModel.create({
      name: "Far in the future",
      date: hoursFromNow(200),
      type: "TRAINING",
      team: CLUB,
    });

    const remindedCount = await sendReminderForEvent(event);

    expect(remindedCount).toBe(1);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    expect(event.reminderSentAt).toBeInstanceOf(Date);
  });
});
