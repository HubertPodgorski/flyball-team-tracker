import { EventType } from "../components/inputs/consts";
import theme from "./theme";
import { formatDate } from "./dateHelpers";

export const sortByNewest = (eventA, eventB) => {
  return new Date(eventB.date) - new Date(eventA.date);
};

export const getFormattedDate = (date) =>
  `${formatDate(date, "eeee")} ${formatDate(
    date,
    "dd/MM/yyyy HH:mm"
  )}`.toUpperCase();

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
        background: theme.palette.error.main,
        color: theme.palette.error.contrastText,
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
