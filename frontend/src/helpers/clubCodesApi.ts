import axios from "axios";
import { apiSuffix } from "./apiCall";

// Public - no auth token, called from the signup form before any exists.
export const fetchClubCodes = async (): Promise<string[]> => {
  const { data } = await axios.get(`${apiSuffix}/users/club-codes`);

  return data;
};
