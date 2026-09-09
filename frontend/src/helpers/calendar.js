import { startOfDay, isBefore } from "date-fns";
import { alpha } from "@mui/material";
import { red } from "@mui/material/colors";
import { EventType } from "../components/inputs/consts";
import theme from "./theme";
import { formatDate } from "./dateHelpers";

// MUI's own red[400] - theme.error.main is a deliberately muted shade that reads as pink instead.
export const ATTENDANCE_ABSENT_RED = red[400];

export const sortByNewest = (eventA, eventB) => {
  return new Date(eventB.date) - new Date(eventA.date);
};

export const sortByOldest = (eventA, eventB) => new Date(eventA.date) - new Date(eventB.date);

// Not over yet - a multi-day event counts as "still upcoming" through its own endDate, not just its start date.
export const isUpcomingEvent = (event, now = new Date()) => {
  const today = startOfDay(now);

  return !isBefore(new Date(event.endDate || event.date), today);
};

// The next event on/after right now - a multi-day event counts as "not over yet" through its own endDate.
export const getNextEvent = (events) => {
  return events.filter((event) => isUpcomingEvent(event)).sort(sortByOldest)[0];
};

// Two disjoint, ready-to-render lists - upcoming soonest-first, past most-recent-first - for the calendar's own two tabs.
export const splitUpcomingAndPast = (events, now = new Date()) => {
  const upcoming = events.filter((event) => isUpcomingEvent(event, now)).sort(sortByOldest);
  const past = events.filter((event) => !isUpcomingEvent(event, now)).sort(sortByNewest);

  return { upcoming, past };
};

// Multi-day (Competition/Seminary) events have no meaningful time-of-day - just a date range.
export const getFormattedDate = (date, endDate) =>
  endDate
    ? `${formatDate(date, "dd/MM/yyyy")} - ${formatDate(endDate, "dd/MM/yyyy")}`.toUpperCase()
    : `${formatDate(date, "eeee")} ${formatDate(date, "dd/MM/yyyy HH:mm")}`.toUpperCase();

export const sortByAttendance = (objectA, objectB) => {
  if (objectA.status === objectB.status) return 0;

  // dog/user A is PRESENT OR is ABSENT but dog/user B didn't select yet
  if (
    objectA.status === "PRESENT" ||
    (objectA.status === "ABSENT" && !objectB.status)
  )
    return -1;

  // dog/user B is PRESENT OR is ABSENT but dog/user A didn't select yet
  if (
    objectB.status === "PRESENT" ||
    (objectB.status === "ABSENT" && !objectA.status)
  )
    return 1;

  return 0;
};

export const getBackgroundColorBasedOnType = (type) => {
  switch (type) {
    case EventType.COMPETITION:
      return "#5A4F3F";
    case EventType.SEMINARY:
      return "#5A2F3F";
    case EventType.MEETING:
      return "#1A2F3F";
    case EventType.TRAINING:
    default:
      return "#2F4F4F";
  }
};

export const getColorsByStatus = (status) => {
  const defaultColors = {
    background: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  };

  switch (status) {
    case "PRESENT":
      return {
        background: theme.palette.success.main,
        color: theme.palette.success.contrastText,
      };

    case "ABSENT":
      return {
        background: ATTENDANCE_ABSENT_RED,
        color: "#ffffff",
      };

    default:
      return defaultColors;
  }
};

// Attendance + planned -> an MUI palette color key (or null if nothing to flag).
export const getDogPlanningColor = (isPlanned, status) => {
  const isPresent = status === "PRESENT";

  if (isPlanned && !isPresent) return "error";
  if (isPlanned && isPresent) return "success";
  if (!isPlanned && isPresent) return "warning";

  return null;
};

// Attendance-toggle button props - same reasoning as getColorsByStatus, theme.error.main reads pink on a solid fill.
export const getAttendanceButtonProps = (status) => {
  if (status === "ABSENT")
    return {
      sx: {
        minWidth: "150px",
        backgroundColor: ATTENDANCE_ABSENT_RED,
        color: "#ffffff",
        "&:hover": { backgroundColor: alpha(ATTENDANCE_ABSENT_RED, 0.85) },
      },
    };

  return { color: status === "PRESENT" ? "success" : "warning", sx: { minWidth: "150px" } };
};
