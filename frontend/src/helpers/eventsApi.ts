import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { Event } from "./types";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export const fetchEvents = async (): Promise<Event[]> => {
  const { data } = await axios.get(`${apiSuffix}/events`, authHeaders());

  return data;
};

export const createEvent = async (data: object): Promise<Event> => {
  const { data: created } = await axios.post(
    `${apiSuffix}/events`,
    data,
    authHeaders()
  );

  return created;
};

export const updateEvent = async (data: object): Promise<Event> => {
  const { data: updated } = await axios.patch(
    `${apiSuffix}/events`,
    data,
    authHeaders()
  );

  return updated;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await axios.delete(`${apiSuffix}/events/${id}`, authHeaders());
};

export const toggleEventDog = async (
  id: string,
  dogId: string
): Promise<void> => {
  await axios.patch(
    `${apiSuffix}/events/${id}/dogs/${dogId}/toggle`,
    {},
    authHeaders()
  );
};

export const toggleEventUser = async (
  id: string,
  userId: string
): Promise<void> => {
  await axios.patch(
    `${apiSuffix}/events/${id}/users/${userId}/toggle`,
    {},
    authHeaders()
  );
};
