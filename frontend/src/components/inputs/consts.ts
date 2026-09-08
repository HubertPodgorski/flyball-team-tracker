import type { TFunction } from "i18next";
import { SelectOption } from "./types";
import { formatDate } from "../../helpers/dateHelpers";

export enum EventType {
  TRAINING = "TRAINING",
  COMPETITION = "COMPETITION",
  SEMINARY = "SEMINARY",
  MEETING = "MEETING",
}

const eventTypes: EventType[] = [
  EventType.TRAINING,
  EventType.COMPETITION,
  EventType.SEMINARY,
  EventType.MEETING,
];

const eventTypeLabelKeys: Record<EventType, string> = {
  [EventType.COMPETITION]: "eventTypes.competition",
  [EventType.SEMINARY]: "eventTypes.seminary",
  [EventType.TRAINING]: "eventTypes.training",
  [EventType.MEETING]: "eventTypes.meeting",
};

export const getEventTypeOptions = (t: TFunction): SelectOption[] =>
  eventTypes.map((type) => ({
    value: type,
    label: t(eventTypeLabelKeys[type]),
  }));

// Date.getDay() values (0=Sun..6=Sat), Monday-first to match the date picker's own columns.
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

const REFERENCE_MONDAY = new Date(2024, 0, 1); // shifted per weekday for locale-aware "eee" formatting

export const getWeekdayOptions = (): SelectOption[] =>
  WEEKDAYS.map((day) => {
    const mondayOffset = (day + 6) % 7;
    const date = new Date(REFERENCE_MONDAY);

    date.setDate(date.getDate() + mondayOffset);

    return { value: String(day), label: formatDate(date, "eee") };
  });
