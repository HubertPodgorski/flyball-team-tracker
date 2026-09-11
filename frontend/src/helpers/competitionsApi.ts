import axios from "axios";
import { apiSuffix } from "./apiCall";
import { authHeaders } from "./authToken";
import {
  AllTeamMappings,
  CompetitionStatsResult,
  GlobalTeamMapping,
  EjsCompetition,
  EjsPreviewResult,
} from "./types";

// A stand-in eventId meaning "every imported competition at once".
export const ALL_COMPETITIONS = "__all__";

const buildFormData = (files: File[]): FormData => {
  const formData = new FormData();

  files.forEach((file) => formData.append("files", file));

  return formData;
};

// Super-admin only. Lists the team names found and the parsed row count.
export const previewEjsImport = async (eventId: string, files: File[]): Promise<EjsPreviewResult> => {
  const { data } = await axios.post(`${apiSuffix}/competitions/${eventId}/ejs-preview`, buildFormData(files), authHeaders());

  return data;
};

// Super-admin only. Replaces the whole competition's rows in the shared EJS pool.
export const confirmEjsImport = async (eventId: string, files: File[]): Promise<{ count: number }> => {
  const { data } = await axios.post(`${apiSuffix}/competitions/${eventId}/ejs-confirm`, buildFormData(files), authHeaders());

  return data;
};

// The shared list of competitions with imported data - every user sees the same one.
export const fetchEjsCompetitions = async (): Promise<EjsCompetition[]> => {
  const { data } = await axios.get(`${apiSuffix}/competitions/ejs-competitions`, authHeaders());

  return data;
};

// Super-admin: every EJS-pool event, whether or not a file has landed in it yet - the import wizard's own picker.
export const fetchAllEjsEvents = async (): Promise<EjsCompetition[]> => {
  const { data } = await axios.get(`${apiSuffix}/competitions/events`, authHeaders());

  return data;
};

export interface EjsEventInput {
  name: string;
  date: Date;
  endDate?: Date | null;
}

// Super-admin: a shared, club-less Event purely to hold EJS imports - not any real club's own calendar.
export const createEjsEvent = async (input: EjsEventInput): Promise<EjsCompetition> => {
  const { data } = await axios.post(`${apiSuffix}/competitions/events`, input, authHeaders());

  return data;
};

// Super-admin: rename/reschedule one - only ever an event the EJS pool actually owns.
export const updateEjsEvent = async (eventId: string, input: Partial<EjsEventInput>): Promise<EjsCompetition> => {
  const { data } = await axios.patch(`${apiSuffix}/competitions/${eventId}`, input, authHeaders());

  return data;
};

// Every EJS team name in the pool, every mapping, and which of them are already the caller's own club's.
export const fetchGlobalTeamMapping = async (): Promise<GlobalTeamMapping> => {
  const { data } = await axios.get(`${apiSuffix}/competitions/team-mapping`, authHeaders());

  return data;
};

// The caller's club picks exactly which EJS team names are its own, in one go (replaces its whole set).
export const setCompetitionTeamMapping = async (ejsTeamNames: string[]): Promise<void> => {
  await axios.post(`${apiSuffix}/competitions/team-mapping`, { ejsTeamNames }, authHeaders());
};

// Super-admin: the whole pool's team names + every mapping + the club list to suggest in the club picker.
export const fetchAllTeamMappings = async (): Promise<AllTeamMappings> => {
  const { data } = await axios.get(`${apiSuffix}/competitions/team-mappings`, authHeaders());

  return data;
};

// Super-admin: assign exactly `ejsTeamNames` to `club` (free text allowed - it's just a grouping label for opponents).
export const setAdminTeamMapping = async (club: string, ejsTeamNames: string[]): Promise<void> => {
  await axios.post(`${apiSuffix}/competitions/team-mappings`, { club, ejsTeamNames }, authHeaders());
};

export const fetchCompetitionStats = async (
  eventId: string,
  sourceFile?: string,
  lineupKey?: string,
  scope?: "ours" | "all",
  teamName?: string
): Promise<CompetitionStatsResult> => {
  const url =
    eventId === ALL_COMPETITIONS
      ? `${apiSuffix}/competitions/all-stats`
      : `${apiSuffix}/competitions/${eventId}/stats`;
  const { data } = await axios.get(url, {
    ...authHeaders(),
    params: {
      ...(sourceFile ? { sourceFile } : {}),
      ...(lineupKey ? { lineupKey } : {}),
      ...(scope === "all" ? { scope } : {}),
      ...(teamName ? { teamName } : {}),
    },
  });

  return data;
};
