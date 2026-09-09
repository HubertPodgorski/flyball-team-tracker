import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { EjsPreviewResult, CompetitionStatsResult } from "./types";

const authHeaders = () => ({ headers: { Authorization: `Bearer ${getAuthToken()}` } });

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

export const confirmEjsImport = async (
  eventId: string,
  files: File[],
  ourTeamNames: string[],
  dogNameOverrides: Record<string, string>
): Promise<{ count: number }> => {
  const formData = buildFormData(files, {
    ourTeamNames: JSON.stringify(ourTeamNames),
    dogNameOverrides: JSON.stringify(dogNameOverrides),
  });
  const { data } = await axios.post(`${apiSuffix}/competitions/${eventId}/ejs-confirm`, formData, authHeaders());

  return data;
};

export const fetchCompetitionStats = async (eventId: string, sourceFile?: string, lineupId?: string): Promise<CompetitionStatsResult> => {
  const { data } = await axios.get(`${apiSuffix}/competitions/${eventId}/stats`, {
    ...authHeaders(),
    params: { ...(sourceFile ? { sourceFile } : {}), ...(lineupId ? { lineupId } : {}) },
  });

  return data;
};
