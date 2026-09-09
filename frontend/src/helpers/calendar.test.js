import { describe, expect, it, vi, afterEach } from "vitest";
import {
  ATTENDANCE_ABSENT_RED,
  getAttendanceButtonProps,
  getBackgroundColorBasedOnType,
  getColorsByStatus,
  getDogPlanningColor,
  getFormattedDate,
  getNextEvent,
  isUpcomingEvent,
  sortByAttendance,
  sortByNewest,
  sortByOldest,
  splitUpcomingAndPast,
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

  it("keeps a multi-day event through its own endDate, even though its start date has already passed", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-06-15T12:00:00"));

    const ongoing = { _id: "ongoing", date: "2026-06-14T08:00:00", endDate: "2026-06-17T00:00:00" };

    expect(getNextEvent([ongoing])).toBe(ongoing);
  });
});

describe("sortByOldest", () => {
  it("orders the earlier event first", () => {
    const older = { date: "2024-01-01" };
    const newer = { date: "2024-06-01" };

    expect(sortByOldest(older, newer)).toBeLessThan(0);
    expect(sortByOldest(newer, older)).toBeGreaterThan(0);
  });
});

describe("isUpcomingEvent", () => {
  const now = new Date("2026-06-15T12:00:00");

  it("is true for an event later today or in the future", () => {
    expect(isUpcomingEvent({ date: "2026-06-15T20:00:00" }, now)).toBe(true);
    expect(isUpcomingEvent({ date: "2026-06-20T10:00:00" }, now)).toBe(true);
  });

  it("is false for an event that already happened", () => {
    expect(isUpcomingEvent({ date: "2026-06-01T10:00:00" }, now)).toBe(false);
  });

  it("stays true through a multi-day event's own endDate, even once its start date has passed", () => {
    expect(isUpcomingEvent({ date: "2026-06-14T08:00:00", endDate: "2026-06-17T00:00:00" }, now)).toBe(true);
  });
});

describe("splitUpcomingAndPast", () => {
  const now = new Date("2026-06-15T12:00:00");

  it("sorts upcoming soonest-first and past most-recent-first, keeping each event on exactly one side", () => {
    const past1 = { _id: "past1", date: "2026-06-01T10:00:00" };
    const past2 = { _id: "past2", date: "2026-06-10T10:00:00" };
    const soon = { _id: "soon", date: "2026-06-16T10:00:00" };
    const later = { _id: "later", date: "2026-06-20T10:00:00" };

    const { upcoming, past } = splitUpcomingAndPast([later, past1, soon, past2], now);

    expect(upcoming).toEqual([soon, later]);
    expect(past).toEqual([past2, past1]);
  });

  it("returns two empty lists for no events", () => {
    expect(splitUpcomingAndPast([], now)).toEqual({ upcoming: [], past: [] });
  });
});

describe("getFormattedDate", () => {
  it("formats the weekday and date/time in Polish, uppercased", () => {
    // 2024-01-01 is a Monday ("poniedziałek" in Polish).
    expect(getFormattedDate("2024-01-01T10:30:00")).toBe(
      "PONIEDZIAŁEK 01/01/2024 10:30"
    );
  });

  it("formats a multi-day event as a plain date range, no weekday or time", () => {
    expect(getFormattedDate("2026-09-08T10:30:00", "2026-09-10T00:00:00")).toBe("08/09/2026 - 10/09/2026");
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

  it("returns a saturated red for ABSENT, not the theme's own muted error color", () => {
    expect(getColorsByStatus("ABSENT")).toEqual({
      background: ATTENDANCE_ABSENT_RED,
      color: "#ffffff",
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

describe("getAttendanceButtonProps", () => {
  it("gives ABSENT a saturated red sx fill, not the theme's own muted error color key", () => {
    const props = getAttendanceButtonProps("ABSENT");

    expect(props.color).toBeUndefined();
    expect(props.sx.backgroundColor).toBe(ATTENDANCE_ABSENT_RED);
    expect(props.sx.backgroundColor).not.toBe(theme.palette.error.main);
  });

  it("uses the success palette color for PRESENT", () => {
    expect(getAttendanceButtonProps("PRESENT").color).toBe("success");
  });

  it("falls back to the warning palette color for anything else", () => {
    expect(getAttendanceButtonProps(undefined).color).toBe("warning");
  });
});
