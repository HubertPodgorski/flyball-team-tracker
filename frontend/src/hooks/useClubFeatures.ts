import { ClubFeatures } from "../helpers/types";
import { ALL_FEATURES_ON } from "../helpers/clubFeatures";
import { useClubSettingsQuery } from "../queries/clubSettings";

// Defaults every flag to on while the query is still loading, so nothing
// flashes hidden then reappears once the real (possibly all-on) data lands.
export const useClubFeatures = (): ClubFeatures => {
  const { data } = useClubSettingsQuery();

  return data?.features ?? ALL_FEATURES_ON;
};
