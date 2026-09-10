import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClub,
  deleteClub,
  fetchAdminClubs,
  fetchClubs,
  updateClub,
} from "../helpers/clubsApi";

export const clubsQueryOptions = () =>
  queryOptions({
    queryKey: ["clubs"],
    queryFn: fetchClubs,
  });

export const useClubsQuery = () => useQuery(clubsQueryOptions());

export const adminClubsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin-clubs"],
    queryFn: fetchAdminClubs,
  });

export const useAdminClubsQuery = () => useQuery(adminClubsQueryOptions());

const useClubMutation = <TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clubs"] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
};

export const useCreateClubMutation = () => useClubMutation(createClub);
export const useUpdateClubMutation = () => useClubMutation(updateClub);
export const useDeleteClubMutation = () => useClubMutation(deleteClub);
