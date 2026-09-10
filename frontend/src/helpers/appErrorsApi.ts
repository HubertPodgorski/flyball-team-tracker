import axios from "axios";
import { apiSuffix } from "./apiCall";
import { authHeaders } from "./authToken";

export interface AppError {
  _id: string;
  message: string;
  stack?: string;
  method?: string;
  route?: string;
  statusCode?: number;
  club?: string;
  userId?: string;
  context?: unknown;
  createdAt: string;
}

export const fetchAppErrors = async (): Promise<AppError[]> => {
  const { data } = await axios.get(`${apiSuffix}/super-admin/errors`, authHeaders());

  return data;
};

export const clearAppErrors = async (): Promise<void> => {
  await axios.delete(`${apiSuffix}/super-admin/errors`, authHeaders());
};
