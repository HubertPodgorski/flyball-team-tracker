import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";
import { ClubFeatures, ClubSettings } from "./types";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export const fetchClubSettings = async (): Promise<ClubSettings> => {
  const { data } = await axios.get(`${apiSuffix}/club-settings`, authHeaders());

  return data;
};

export const updateClubSettings = async (
  features: Partial<ClubFeatures>
): Promise<ClubSettings> => {
  const { data } = await axios.patch(
    `${apiSuffix}/club-settings`,
    { features },
    authHeaders()
  );

  return data;
};
