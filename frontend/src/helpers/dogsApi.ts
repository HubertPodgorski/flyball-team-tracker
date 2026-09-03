import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { Dog } from "./types";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export const fetchDogs = async (): Promise<Dog[]> => {
  const { data } = await axios.get(`${apiSuffix}/dogs`, authHeaders());

  return data;
};

export const createDog = async (data: object): Promise<Dog> => {
  const { data: created } = await axios.post(
    `${apiSuffix}/dogs`,
    data,
    authHeaders()
  );

  return created;
};

export const updateDog = async (data: object): Promise<Dog> => {
  const { data: updated } = await axios.patch(
    `${apiSuffix}/dogs`,
    data,
    authHeaders()
  );

  return updated;
};

export const deleteDog = async (id: string): Promise<void> => {
  await axios.delete(`${apiSuffix}/dogs/${id}`, authHeaders());
};
