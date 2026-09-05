import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";

// Every real club - only used by super-admin surfaces, which are always
// already authenticated (unlike club-codes, needed before login exists).
export const fetchClubs = async (): Promise<string[]> => {
  const { data } = await axios.get(`${apiSuffix}/users/clubs`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });

  return data;
};
