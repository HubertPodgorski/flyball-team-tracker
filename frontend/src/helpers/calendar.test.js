import { describe, expect, it, vi, afterEach } from "vitest";
import {
  getBackgroundColorBasedOnType,
  getColorsByStatus,
  getDogPlanningColor,
  getFormattedDate,
  getNextEvent,
  sortByAttendance,
  sortByNewest,
} from "./calendar";
import { EventType } from "../components/inputs/consts";
import theme from "./theme";

describe("sortByNewest", () => {
  it("orders the more recent event first", () => {
    const older = { date: "2024-01-01" };
    const newer = { date: "2024-06-01" };

    expect(sortByNewest(newer, older)).toBeLessThan(0);
    expect(sortByNewest(older, newer)).toBeGreaterThan(0);
  });
});

describe("getNextEvent", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("picks the soonest event that hasn't happened yet", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-06-15T12:00:00"));

    const soonest = { _id: "soonest", date: "2026-06-16T10:00:00" };
    const later = { _id: "later", date: "2026-06-20T10:00:00" };

    expect(getNextEvent([later, soonest])).toBe(soonest);
  });

  it("ignores events already in the past", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-06-15T12:00:00"));

    const past = { _id: "past", date: "2026-06-01T10:00:00" };
    const future = { _id: "future", date: "2026-06-20T10:00:00" };

    expect(getNextEvent([past, future])).toBe(future);
  });

  it("includes an event happening later today", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-06-15T08:00:00"));

    const laterToday = { _id: "later-today", date: "2026-06-15T20:00:00" };

    expect(getNextEvent([laterToday])).toBe(laterToday);
  });

  it("returns undefined when every event is in the past", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-06-15T12:00:00"));

    expect(getNextEvent([{ _id: "past", date: "2026-06-01T10:00:00" }])).toBeUndefined();
  });

  it("returns undefined for an empty list", () => {
    expect(getNextEvent([])).toBeUndefined();
  });
});

describe("getFormattedDate", () => {
  it("formats the weekday and date/time in Polish, uppercased", () => {
    // 2024-01-01 is a Monday ("poniedziałek" in Polish).
    expect(getFormattedDate("2024-01-01T10:30:00")).toBe(
      "PONIEDZIAŁEK 01/01/2024 10:30"
    );
  });
});

describe("sortByAttendance", () => {
  it("treats equal statuses as equal", () => {
    expect(sortByAttendance({ status: "PRESENT" }, { status: "PRESENT" })).toBe(0);
    expect(sortByAttendance({ status: undefined }, { status: undefined })).toBe(0);
  });

  it("puts PRESENT ahead of an undecided entry", () => {
    expect(sortByAttendance({ status: "PRESENT" }, { status: undefined })).toBe(-1);
    expect(sortByAttendance({ status: undefined }, { status: "PRESENT" })).toBe(1);
  });

  it("puts ABSENT ahead of an undecided entry", () => {
    expect(sortByAttendance({ status: "ABSENT" }, { status: undefined })).toBe(-1);
    expect(sortByAttendance({ status: undefined }, { status: "ABSENT" })).toBe(1);
  });

  it("puts PRESENT ahead of ABSENT", () => {
    expect(sortByAttendance({ status: "PRESENT" }, { status: "ABSENT" })).toBe(-1);
    expect(sortByAttendance({ status: "ABSENT" }, { status: "PRESENT" })).toBe(1);
  });
});

describe("getBackgroundColorBasedOnType", () => {
  it("returns a distinct color per event type", () => {
    expect(getBackgroundColorBasedOnType(EventType.COMPETITION)).toBe("#5A4F3F");
    expect(getBackgroundColorBasedOnType(EventType.SEMINARY)).toBe("#5A2F3F");
    expect(getBackgroundColorBasedOnType(EventType.MEETING)).toBe("#1A2F3F");
    expect(getBackgroundColorBasedOnType(EventType.TRAINING)).toBe("#2F4F4F");
  });

  it("falls back to the training color for an unknown type", () => {
    expect(getBackgroundColorBasedOnType("UNKNOWN")).toBe("#2F4F4F");
  });
});

describe("getColorsByStatus", () => {
  it("returns the theme's success color for PRESENT", () => {
    expect(getColorsByStatus("PRESENT")).toEqual({
      background: theme.palette.success.main,
      color: theme.palette.success.contrastText,
    });
  });

  it("returns the theme's error color for ABSENT", () => {
    expect(getColorsByStatus("ABSENT")).toEqual({
      background: theme.palette.error.main,
      color: theme.palette.error.contrastText,
    });
  });

  it("falls back to the theme's warning color for anything else", () => {
    expect(getColorsByStatus(undefined)).toEqual({
      background: theme.palette.warning.main,
      color: theme.palette.warning.contrastText,
    });
  });
});

describe("getDogPlanningColor", () => {
  it("flags a planned dog that isn't present as error - shouldn't be planned", () => {
    expect(getDogPlanningColor(true, "ABSENT")).toBe("error");
    expect(getDogPlanningColor(true, undefined)).toBe("error");
  });

  it("flags a planned, present dog as success - correctly planned", () => {
    expect(getDogPlanningColor(true, "PRESENT")).toBe("success");
  });

  it("flags a present, unplanned dog as warning - still needs planning", () => {
    expect(getDogPlanningColor(false, "PRESENT")).toBe("warning");
  });

  it("returns null when neither planned nor present - nothing to flag", () => {
    expect(getDogPlanningColor(false, "ABSENT")).toBeNull();
    expect(getDogPlanningColor(false, undefined)).toBeNull();
  });
});
