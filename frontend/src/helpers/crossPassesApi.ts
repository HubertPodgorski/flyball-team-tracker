import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { CrossPass } from "./types";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export const fetchCrossPasses = async (): Promise<CrossPass[]> => {
  const { data } = await axios.get(`${apiSuffix}/cross-passes`, authHeaders());

  return data;
};

export const createCrossPass = async (data: object): Promise<CrossPass> => {
  const { data: created } = await axios.post(
    `${apiSuffix}/cross-passes`,
    data,
    authHeaders()
  );

  return created;
};

export const updateCrossPass = async (data: object): Promise<CrossPass> => {
  const { data: updated } = await axios.patch(
    `${apiSuffix}/cross-passes`,
    data,
    authHeaders()
  );

  return updated;
};

export const deleteCrossPass = async (id: string): Promise<void> => {
  await axios.delete(`${apiSuffix}/cross-passes/${id}`, authHeaders());
};
