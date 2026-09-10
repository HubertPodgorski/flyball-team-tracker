import axios from "axios";
import { apiSuffix } from "./apiCall";
import { authHeaders } from "./authToken";
import { Task } from "./types";

// eventId: a real event id for one session's board, "none" for the default board, undefined for every task in the club.
export const fetchTasks = async (eventId?: string): Promise<Task[]> => {
  const { data } = await axios.get(`${apiSuffix}/tasks`, {
    ...authHeaders(),
    params: typeof eventId === "string" && eventId ? { eventId } : {},
  });

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

export const copyTasksFromPreviousSession = async (
  toEventId: string
): Promise<{ copied: number; fromEventId?: string }> => {
  const { data } = await axios.post(
    `${apiSuffix}/tasks/copy-from-previous`,
    { toEventId },
    authHeaders()
  );

  return data;
};
