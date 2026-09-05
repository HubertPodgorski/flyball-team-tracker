import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchClubs } from "../helpers/clubsApi";

export const clubsQueryOptions = () =>
  queryOptions({
    queryKey: ["clubs"],
    queryFn: fetchClubs,
    // Static for now (see helpers/teams.js) - same list all session.
    staleTime: Infinity,
  });

export const useClubsQuery = () => useQuery(clubsQueryOptions());
