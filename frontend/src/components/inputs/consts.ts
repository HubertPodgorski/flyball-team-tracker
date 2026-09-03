import type { TFunction } from "i18next";
import { SelectOption } from "./types";

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
