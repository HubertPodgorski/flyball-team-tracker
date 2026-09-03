import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { DogTask } from "./types";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export const fetchDogTasks = async (): Promise<DogTask[]> => {
  const { data } = await axios.get(`${apiSuffix}/dog-tasks`, authHeaders());

  return data;
};

export const createDogTask = async (data: object): Promise<DogTask> => {
  const { data: created } = await axios.post(
    `${apiSuffix}/dog-tasks`,
    data,
    authHeaders()
  );

  return created;
};

export const updateDogTask = async (data: object): Promise<DogTask> => {
  const { data: updated } = await axios.patch(
    `${apiSuffix}/dog-tasks`,
    data,
    authHeaders()
  );

  return updated;
};

export const deleteDogTask = async (id: string): Promise<void> => {
  await axios.delete(`${apiSuffix}/dog-tasks/${id}`, authHeaders());
};
