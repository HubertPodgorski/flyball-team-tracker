import { EventType } from "../components/inputs/consts";

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
  // The session this task is planned for; null/absent = the club's default board.
  eventId?: string | null;
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
  endDate?: string;
  name: string;
  type: EventType;
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

export interface Resource {
  _id: string;
  name: string;
  url: string;
}

export interface DogWithAttendance extends Dog {
  status?: string;
}

export interface DogWithAttendanceAndPlannedInfo extends DogWithAttendance {
  isPlanned?: boolean;
}

export interface Subscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
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

export interface ClubFeatures {
  teamsAndLineups: boolean;
  crossPasses: boolean;
  eventsCalendar: boolean;
  ejsStats: boolean;
  dogTasksCatalog: boolean;
  usefulResources: boolean;
  netTime: boolean;
}

export interface ClubSettings {
  _id: string;
  features: ClubFeatures;
}

// A club row from the super-admin clubs panel (api/src/models/clubModel.js).
export interface Club {
  _id: string;
  code: string;
  team: string;
  name: string;
  suspended: boolean;
}

export interface EjsDog {
  name: string | null;
  matchedDogId: string | null;
  runningOnLights: boolean;
  runningOnDogId: string | null;
  lightsTime: number | string | null;
  crossTime: number | string | null;
  time: number | null;
  faulted: boolean;
  suggestions: { dogId: string; name: string; distance: number }[];
}

export interface EjsExtraPass {
  time: number;
  dogIndex: number | null;
}

export interface EjsEntry {
  sourceFile: string;
  race: number;
  division: number;
  match: number;
  teamName: string;
  opponentName: string;
  teamTime: number | null;
  teamNetTime: number | null;
  resultFlag: string | null;
  result: string | null;
  jumpHeight: number;
  ourTeam: boolean;
  dogs: EjsDog[];
  extraPasses: EjsExtraPass[];
}

export interface EjsPreviewResult {
  teamNames: string[];
  rowCount: number;
}

// A shared, club-less competition Event (the EJS sentinel club) that has imported EJS data - the list every user picks from.
export interface EjsCompetition {
  _id: string;
  name: string;
  date: string;
  endDate?: string;
}

export interface GlobalTeamMapping {
  // Every EJS team name in the whole pool.
  teamNames: string[];
  // ejsTeamName -> owning club, for the names that are claimed.
  mappings: Record<string, string>;
  // The subset of teamNames the current club owns.
  myTeamNames: string[];
}

// Super-admin: same team names + mappings, plus the known-club list to suggest in the club picker.
export interface AllTeamMappings {
  teamNames: string[];
  mappings: Record<string, string>;
  clubs: { team: string; name: string }[];
}

export interface CompetitionDogStats {
  dogId: string;
  name: string | null;
  // Lineup-comparison rows only - the lineup's own dog order, shown under its name in a smaller font.
  nameSubLabel?: string | null;
  // Opponent (scope=others) rows only - the opponent team this dog ran for.
  teamName?: string | null;
  totalPasses: number;
  faultCount: number;
  faultRate: number | null;
  cleanCount: number;
  okCount: number;
  // Exact ok text ("ok"/"Ok"/"OK") -> count, for the outcome pie's ok sub-slices.
  okByText: Record<string, number>;
  okPercentOfAllPasses: number | null;
  okPercentOfCleanPasses: number | null;
  avgCrossTime: number | null;
  avgLightsTime: number | null;
  avgRunTime: number | null;
}

// A lineup for these stats - a distinct 4-dog running order found in the imported rows, not a registered Team.matchups lineup.
export interface CompetitionLineup {
  key: string;
  order: string;
  heatCount: number;
  // The mapped team this running order ran for - lets the Team tab show only the picked team's lineups.
  teamName?: string | null;
}

// One dog's changeover quality behind a specific predecessor dog.
export interface PredecessorStat {
  dog: string;
  predecessor: string;
  heats: number;
  avgCrossTime: number | null;
  avgRunTime: number | null;
  faultCount: number;
  faultRate: number | null;
  okCount: number;
}

export interface CompetitionRecord {
  value: number;
  eventId: string;
  eventName: string | null;
}

export interface CompetitionRecords {
  // Fastest clean team net time per team of the club, with that heat's own 4-dog running order.
  teamBests: (CompetitionRecord & { teamName: string; division: number | null; dogs: string[] })[];
  dogBests: (CompetitionRecord & { dog: string })[];
}

export interface NetVsGrossStats {
  teamName: string;
  heats: number;
  avgGross: number | null;
  avgNet: number | null;
  avgStartOverhead: number | null;
  avgOverlap: number | null;
}

export interface CompetitionStatsResult {
  sourceFiles: string[];
  dogs: CompetitionDogStats[];
  // Changeover-by-predecessor, records and net-vs-gross - all over the caller's club's (or picked team's) own rows.
  pairings: PredecessorStat[];
  records: CompetitionRecords;
  // One entry per team of the club (or just the picked team).
  netVsGross: NetVsGrossStats[];
  // Every team name in the competition pool - the team filter's options in "all clubs" scope.
  teamNames: string[];
  // The caller's club's own mapped team names - the team filter's options in "my club" scope.
  myTeamNames: string[];
  // ejsTeamName -> owning club's display name, for the "whole clubs" view (a club = all its team names summed).
  clubByTeamName: Record<string, string>;
  // The running orders in the caller's club's own rows.
  lineups: CompetitionLineup[];
}
