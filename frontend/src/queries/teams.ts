import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getCurrentClub } from "../helpers/authToken";
import {
  createTeam,
  deleteTeam,
  fetchTeams,
  updateTeam,
} from "../helpers/teamsApi";

// Keyed by active club so switching clubs refetches instead of reusing the old cache.
export const teamsQueryOptions = (club = getCurrentClub()) =>
  queryOptions({
    queryKey: ["teams", club],
    queryFn: fetchTeams,
    enabled: !!club,
  });

export const useTeamsQuery = () => useQuery(teamsQueryOptions());

// No cache update on success - squads_updated (SSE) is the source of truth.
export const useCreateTeamMutation = () =>
  useMutation({ mutationFn: createTeam });

export const useUpdateTeamMutation = () =>
  useMutation({ mutationFn: updateTeam });

export const useDeleteTeamMutation = () =>
  useMutation({ mutationFn: deleteTeam });
