export enum Roles {
  TRAINER = "TRAINER",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export interface User {
  _id: string;

  dogs: Dog[];
  name: string;
  email: string;
  password: string;
  team: string;
  language: "en" | "pl";
  // TODO: add enums
  roles: Roles[];
}

// Field names match the backend's stored schema - renaming needs a data migration, not just a code change.
export interface LineupRef {
  squadId: string;
  matchupId: string;
}

export interface Task {
  _id: string;

  dogs: Dog[];
  description: string;
  position: Position;
  // Property key matches the backend's stored schema - renaming needs a data migration, not just a code change.
  matchupRef?: LineupRef;
}

export interface Position {
  columnIndex: number;
  rowIndex: number;
  positionIndex: number;
}

export interface Dog {
  _id: string;
  name: string;
  note?: string;
  // cm. Optional - unset defaults to 35 for lineup jump-height calculations
  // only, never shown as if it were a real, explicitly-set value.
  jumpHeight?: number;
  // When true, editing this dog's cross-pass timing/note/starting-position
  // in one lineup propagates to every other lineup entry with the same
  // predecessor. Off by default: each lineup stays independent.
  syncCrossPasses?: boolean;
  // Independent of syncCrossPasses above - when true, this dog's lineup
  // cross-pass entries also stay in sync with its standalone My Dogs
  // cross-passes (same dogId + same predecessor bridges the two systems).
  syncCrossPassesWithMyDogs?: boolean;
}

export interface Event {
  _id: string;
  date: string;
  name: string;
  dogs: { status: string; _id: string }[];
  users: {
    status: string;
    _id: string;
  }[];
}

export interface DogTask {
  _id: string;
  name: string;
}

export interface DogWithAttendance extends Dog {
  status?: string;
}

export interface DogWithAttendanceAndPlannedInfo extends DogWithAttendance {
  isPlanned?: boolean;
}

export interface Subscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  team: string;
  userId: string;
}

export interface CrossPass {
  _id: string;
  dogId: string;
  runningOnDog?: Dog;
  runningOnLights?: boolean;
  note?: string;
  startingPosition?: string;
  time?: number;
}

// One cross-pass grid cell.
export interface LineupCrossPass {
  _id: string;
  dogId: string;
  runningOnDog?: Dog;
  runningOnLights?: boolean;
  note?: string;
  startingPosition?: string;
  time?: number;
}

export interface Lineup {
  _id: string;
  name?: string;
  dogs: Dog[];
  crossPasses: LineupCrossPass[];
}

export interface Team {
  _id: string;
  name: string;
  dogs: Dog[];
  // Property key matches the backend's stored schema - renaming needs a data migration, not just a code change.
  matchups: Lineup[];
}
