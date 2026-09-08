import { describe, expect, it } from "vitest";
import { getRecurringDates, maxRecurringUntil } from "./recurringEvents.js";

describe("getRecurringDates", () => {
  it("returns one date per matching weekday per week, keeping the time-of-day", () => {
    // 2026-09-07 is a Monday. Ask for Tue(2) + Thu(4) through the following Thu.
    const startDate = new Date("2026-09-07T17:30:00.000Z");
    const until = new Date("2026-09-17T00:00:00.000Z");

    const dates = getRecurringDates(startDate, [2, 4], until);

    expect(dates.map((date) => date.toISOString().slice(0, 10))).toEqual([
      "2026-09-08",
      "2026-09-10",
      "2026-09-15",
      "2026-09-17",
    ]);
    expect(dates.every((date) => date.getUTCHours() === 17 && date.getUTCMinutes() === 30)).toBe(true);
  });

  it("includes the whole 'until' day regardless of its own time-of-day", () => {
    // Same bug class as Calendar.jsx's "To" filter - until at midnight shouldn't exclude same-day.
    const startDate = new Date("2026-09-08T17:30:00.000Z"); // Tuesday
    const until = new Date("2026-09-08T00:00:00.000Z"); // same day, midnight

    expect(getRecurringDates(startDate, [2], until)).toHaveLength(1);
  });

  it("returns nothing when no weekday in the range matches", () => {
    const startDate = new Date("2026-09-07T17:30:00.000Z"); // Monday
    const until = new Date("2026-09-08T00:00:00.000Z"); // Tuesday

    expect(getRecurringDates(startDate, [3], until)).toEqual([]); // Wednesday never occurs
  });

  it("returns nothing when until is before startDate", () => {
    const startDate = new Date("2026-09-10T17:30:00.000Z");
    const until = new Date("2026-09-01T00:00:00.000Z");

    expect(getRecurringDates(startDate, [0, 1, 2, 3, 4, 5, 6], until)).toEqual([]);
  });

  it("handles a month/year rollover", () => {
    const startDate = new Date("2026-12-29T17:30:00.000Z"); // Tuesday
    const until = new Date("2027-01-06T00:00:00.000Z");

    const dates = getRecurringDates(startDate, [2], until);

    expect(dates.map((date) => date.toISOString().slice(0, 10))).toEqual([
      "2026-12-29",
      "2027-01-05",
    ]);
  });
});

describe("maxRecurringUntil", () => {
  it("is exactly 3 months after the start date", () => {
    const startDate = new Date("2026-09-07T17:30:00.000Z");

    expect(maxRecurringUntil(startDate).toISOString()).toBe("2026-12-07T17:30:00.000Z");
  });
});
