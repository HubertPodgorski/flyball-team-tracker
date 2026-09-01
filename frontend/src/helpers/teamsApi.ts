import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { Team } from "./types";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

// Endpoint stays /squads - backend hasn't renamed its side yet.
export const fetchTeams = async (): Promise<Team[]> => {
  const { data } = await axios.get(`${apiSuffix}/squads`, authHeaders());

  return data;
};

export const createTeam = async (data: object): Promise<Team> => {
  const { data: created } = await axios.post(
    `${apiSuffix}/squads`,
    data,
    authHeaders()
  );

  return created;
};

export const updateTeam = async (data: object): Promise<Team> => {
  const { data: updated } = await axios.patch(
    `${apiSuffix}/squads`,
    data,
    authHeaders()
  );

  return updated;
};

export const deleteTeam = async (id: string): Promise<void> => {
  await axios.delete(`${apiSuffix}/squads/${id}`, authHeaders());
};
