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
  // TODO: add enums
  roles: Roles[];
}

// Field names (squadId, matchupId) match the backend schema verbatim - not renamed yet.
export interface LineupRef {
  squadId: string;
  matchupId: string;
}

export interface Task {
  _id: string;

  dogs: Dog[];
  description: string;
  position: Position;
  // Property key matches the backend schema verbatim - not renamed yet.
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

export interface EventTemplate {
  _id: string;
  name: string;
  tasks: Task[];
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
  // Property key matches the backend schema verbatim - not renamed yet.
  matchups: Lineup[];
}
