import { ClubFeatures } from "../helpers/types";
import { useClubSettingsQuery } from "../queries/clubSettings";

const ALL_ON: ClubFeatures = {
  teamsAndLineups: true,
  crossPasses: true,
  eventsCalendar: true,
  ejsStats: true,
  dogTasksCatalog: true,
  usefulResources: true,
  netTime: true,
};

// Defaults every flag to on while the query is still loading, so nothing
// flashes hidden then reappears once the real (possibly all-on) data lands.
export const useClubFeatures = (): ClubFeatures => {
  const { data } = useClubSettingsQuery();

  return data?.features ?? ALL_ON;
};
