import axios from "axios";
import { apiSuffix } from "./apiCall";
import { authHeaders } from "./authToken";
import {
  CompetitionStatsResult,
  CompetitionTeamMapping,
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

export const fetchCompetitionTeamMapping = async (eventId: string): Promise<CompetitionTeamMapping> => {
  const { data } = await axios.get(`${apiSuffix}/competitions/${eventId}/team-mapping`, authHeaders());

  return data;
};

// The caller's club claims an EJS team name as its own.
export const setCompetitionTeamMapping = async (ejsTeamName: string): Promise<void> => {
  await axios.post(`${apiSuffix}/competitions/team-mapping`, { ejsTeamName }, authHeaders());
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
