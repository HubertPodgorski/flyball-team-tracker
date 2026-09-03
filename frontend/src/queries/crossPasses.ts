import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getCurrentClub } from "../helpers/authToken";
import {
  createCrossPass,
  deleteCrossPass,
  fetchCrossPasses,
  updateCrossPass,
} from "../helpers/crossPassesApi";

export const crossPassesQueryOptions = (club = getCurrentClub()) =>
  queryOptions({
    queryKey: ["crossPasses", club],
    queryFn: fetchCrossPasses,
    enabled: !!club,
  });

export const useCrossPassesQuery = () => useQuery(crossPassesQueryOptions());

// No cache update on success - cross_passes_updated (SSE) is the source of truth.
export const useCreateCrossPassMutation = () =>
  useMutation({ mutationFn: createCrossPass });

export const useUpdateCrossPassMutation = () =>
  useMutation({ mutationFn: updateCrossPass });

export const useDeleteCrossPassMutation = () =>
  useMutation({ mutationFn: deleteCrossPass });
