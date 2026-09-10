import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { EjsPreviewResult, CompetitionStatsResult } from "./types";

const authHeaders = () => ({ headers: { Authorization: `Bearer ${getAuthToken()}` } });

// A stand-in eventId meaning "every imported competition at once".
export const ALL_COMPETITIONS = "__all__";

const buildFormData = (files: File[], fields: Record<string, string>): FormData => {
  const formData = new FormData();

  files.forEach((file) => formData.append("files", file));
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));

  return formData;
};

// Without ourTeamNames, just lists team names found; pass it to get per-dog match proposals for those teams' rows.
export const previewEjsImport = async (eventId: string, files: File[], ourTeamNames?: string[]): Promise<EjsPreviewResult> => {
  const formData = buildFormData(files, ourTeamNames ? { ourTeamNames: JSON.stringify(ourTeamNames) } : {});
  const { data } = await axios.post(`${apiSuffix}/competitions/${eventId}/ejs-preview`, formData, authHeaders());

  return data;
};

export const confirmEjsImport = async (eventId: string, files: File[], ourTeamNames: string[]): Promise<{ count: number }> => {
  const formData = buildFormData(files, { ourTeamNames: JSON.stringify(ourTeamNames) });
  const { data } = await axios.post(`${apiSuffix}/competitions/${eventId}/ejs-confirm`, formData, authHeaders());

  return data;
};

export const fetchImportedCompetitionIds = async (): Promise<string[]> => {
  const { data } = await axios.get(`${apiSuffix}/competitions/imported`, authHeaders());

  return data.eventIds;
};

export const fetchCompetitionStats = async (
  eventId: string,
  sourceFile?: string,
  lineupKey?: string,
  scope?: "ours" | "all"
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
    },
  });

  return data;
};
