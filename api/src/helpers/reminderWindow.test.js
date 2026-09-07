import { describe, expect, it } from "vitest";
import { isWithinReminderWindow } from "./reminderWindow.js";

const HOUR_MS = 60 * 60 * 1000;
const NOW = new Date("2026-01-01T00:00:00.000Z");

const hoursAway = (hours) => new Date(NOW.getTime() + hours * HOUR_MS);

describe("isWithinReminderWindow", () => {
  it("is true exactly at the 23h boundary", () => {
    expect(isWithinReminderWindow(hoursAway(23), NOW)).toBe(true);
  });

  it("is true exactly at the 25h boundary", () => {
    expect(isWithinReminderWindow(hoursAway(25), NOW)).toBe(true);
  });

  it("is true in the middle of the window", () => {
    expect(isWithinReminderWindow(hoursAway(24), NOW)).toBe(true);
  });

  it("is false just before the 23h boundary", () => {
    expect(isWithinReminderWindow(hoursAway(22.999), NOW)).toBe(false);
  });

  it("is false just after the 25h boundary", () => {
    expect(isWithinReminderWindow(hoursAway(25.001), NOW)).toBe(false);
  });

  it("is false for an event far in the future", () => {
    expect(isWithinReminderWindow(hoursAway(48), NOW)).toBe(false);
  });

  it("is false for an event in the past", () => {
    expect(isWithinReminderWindow(hoursAway(-1), NOW)).toBe(false);
  });
});
