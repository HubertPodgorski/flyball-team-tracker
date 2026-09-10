import axios from "axios";
import { apiSuffix } from "./apiCall";
import { authHeaders } from "./authToken";
import { Club } from "./types";

// Every real club - only used by super-admin surfaces, which are always
// already authenticated (unlike club-codes, needed before login exists).
export const fetchClubs = async (): Promise<string[]> => {
  const { data } = await axios.get(`${apiSuffix}/users/clubs`, authHeaders());

  return data;
};

export const fetchAdminClubs = async (): Promise<Club[]> => {
  const { data } = await axios.get(`${apiSuffix}/super-admin/clubs`, authHeaders());

  return data;
};

export const createClub = async (body: { code: string; name: string }): Promise<Club> => {
  const { data } = await axios.post(`${apiSuffix}/super-admin/clubs`, body, authHeaders());

  return data;
};

export const updateClub = async (body: { _id: string; name?: string; suspended?: boolean }): Promise<Club> => {
  const { data } = await axios.patch(`${apiSuffix}/super-admin/clubs`, body, authHeaders());

  return data;
};

export const deleteClub = async (_id: string): Promise<{ deleted: Record<string, number> }> => {
  const { data } = await axios.delete(`${apiSuffix}/super-admin/clubs/${_id}`, authHeaders());

  return data;
};
