import { describe, expect, it } from "vitest";
import {
  getBackgroundColorBasedOnType,
  getColorsByStatus,
  getFormattedDate,
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
      color: "#333",
    });
  });

  it("returns the theme's error color for ABSENT", () => {
    expect(getColorsByStatus("ABSENT")).toEqual({
      background: theme.palette.error.main,
      color: "#fff",
    });
  });

  it("falls back to the theme's warning color for anything else", () => {
    expect(getColorsByStatus(undefined)).toEqual({
      background: theme.palette.warning.main,
      color: "#333",
    });
  });
});
