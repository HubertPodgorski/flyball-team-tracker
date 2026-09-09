import { Dog, LineupRef, Position } from "../../helpers/types";
import { EventType } from "../../components/inputs/consts";

export interface CreateEditTaskFormType {
  description: string;
  dogs: string[];
  position: Position;
  matchupRef?: LineupRef;
}

export interface CreateEditTaskRequestType {
  description: string;
  dogs: Dog[];
  position: Position;
  matchupRef?: LineupRef;
}

// What EventForm's callers pass in - not the full Event (no _id/dogs/users on a fresh Add).
export interface EventFormInitialData {
  name: string;
  date: Date | string;
  endDate?: string | null;
  type: EventType;
  team?: string;
}

export interface CreateEditEventFormType {
  name: string;
  date: Date | null;
  // Competition/Seminary only - optional, date-only (no time-of-day meaning).
  endDate: Date | null;
  type: EventType | "";
  team: string;
  // Transient create-only UI state, never part of a persisted Event.
  repeatsWeekly: boolean;
  weekdays: string[];
  until: Date | null;
}

export interface CreateEditEventRequestType {
  name: string;
  date: Date | null;
  endDate?: Date | null;
  type: EventType | "";
  team?: string;
}

export interface CreateRecurringEventsRequestType {
  name: string;
  date: Date | null;
  type: EventType | "";
  weekdays: number[];
  until: Date | null;
}
