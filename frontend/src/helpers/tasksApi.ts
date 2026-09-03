import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { Task } from "./types";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export const fetchTasks = async (): Promise<Task[]> => {
  const { data } = await axios.get(`${apiSuffix}/tasks`, authHeaders());

  return data;
};

export const createTask = async (data: object): Promise<Task> => {
  const { data: created } = await axios.post(
    `${apiSuffix}/tasks`,
    data,
    authHeaders()
  );

  return created;
};

export const updateTask = async (data: object): Promise<Task> => {
  const { data: updated } = await axios.patch(
    `${apiSuffix}/tasks`,
    data,
    authHeaders()
  );

  return updated;
};

export const deleteTask = async (id: string): Promise<void> => {
  await axios.delete(`${apiSuffix}/tasks/${id}`, authHeaders());
};

export const reorderTasks = async (
  tasks: { _id: string; position: object }[]
): Promise<void> => {
  await axios.patch(`${apiSuffix}/tasks/reorder`, { tasks }, authHeaders());
};
