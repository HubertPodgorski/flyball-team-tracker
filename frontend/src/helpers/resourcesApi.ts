import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { Resource } from "./types";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export const fetchResources = async (): Promise<Resource[]> => {
  const { data } = await axios.get(`${apiSuffix}/resources`, authHeaders());

  return data;
};

export const createResource = async (data: object): Promise<Resource> => {
  const { data: created } = await axios.post(
    `${apiSuffix}/resources`,
    data,
    authHeaders()
  );

  return created;
};

export const updateResource = async (data: object): Promise<Resource> => {
  const { data: updated } = await axios.patch(
    `${apiSuffix}/resources`,
    data,
    authHeaders()
  );

  return updated;
};

export const deleteResource = async (id: string): Promise<void> => {
  await axios.delete(`${apiSuffix}/resources/${id}`, authHeaders());
};
