import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export const fetchSuperAdminList = async (
  entity: string,
  team?: string
): Promise<any[]> => {
  const { data } = await axios.get(`${apiSuffix}/super-admin/${entity}`, {
    ...authHeaders(),
    params: team ? { team } : {},
  });

  return data;
};

export const createSuperAdminItem = async (
  entity: string,
  data: object
): Promise<any> => {
  const { data: created } = await axios.post(
    `${apiSuffix}/super-admin/${entity}`,
    data,
    authHeaders()
  );

  return created;
};

export const updateSuperAdminItem = async (
  entity: string,
  data: object
): Promise<any> => {
  const { data: updated } = await axios.patch(
    `${apiSuffix}/super-admin/${entity}`,
    data,
    authHeaders()
  );

  return updated;
};

export const deleteSuperAdminItem = async (
  entity: string,
  _id: string,
  team: string
): Promise<void> => {
  await axios.delete(`${apiSuffix}/super-admin/${entity}/${_id}`, {
    ...authHeaders(),
    params: { team },
  });
};

export const resetSuperAdminUserPassword = async (
  _id: string
): Promise<{ temporaryPassword: string }> => {
  const { data } = await axios.patch(
    `${apiSuffix}/super-admin/users/${_id}/reset-password`,
    {},
    authHeaders()
  );

  return data;
};
