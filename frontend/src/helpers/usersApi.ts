import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { User } from "./types";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export const fetchUsers = async (): Promise<User[]> => {
  const { data } = await axios.get(`${apiSuffix}/users`, authHeaders());

  return data;
};

export const updateUser = async (data: object): Promise<User> => {
  const { data: updated } = await axios.patch(
    `${apiSuffix}/users`,
    data,
    authHeaders()
  );

  return updated;
};

export const deleteUser = async (id: string): Promise<void> => {
  await axios.delete(`${apiSuffix}/users/${id}`, authHeaders());
};

export const changeOwnPassword = async (data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  await axios.patch(`${apiSuffix}/users/change-password`, data, authHeaders());
};

export const resetUserPassword = async (
  userId: string
): Promise<{ temporaryPassword: string }> => {
  const { data } = await axios.patch(
    `${apiSuffix}/users/${userId}/reset-password`,
    {},
    authHeaders()
  );

  return data;
};
