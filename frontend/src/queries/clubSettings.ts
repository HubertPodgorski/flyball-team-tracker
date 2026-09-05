import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentClub } from "../helpers/authToken";
import { fetchClubSettings, updateClubSettings } from "../helpers/clubSettingsApi";

// Keyed by active club so switching clubs refetches instead of reusing the old cache.
export const clubSettingsQueryOptions = (club = getCurrentClub()) =>
  queryOptions({
    queryKey: ["clubSettings", club],
    queryFn: fetchClubSettings,
    enabled: !!club,
  });

export const useClubSettingsQuery = () => useQuery(clubSettingsQueryOptions());

export const useUpdateClubSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClubSettings,
    // Applies the response immediately - no need to wait on the SSE
    // round-trip, which would just set the same data again anyway.
    onSuccess: (settings) => {
      queryClient.setQueryData(clubSettingsQueryOptions().queryKey, settings);
    },
  });
};
