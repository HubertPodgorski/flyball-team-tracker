import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getCurrentClub } from "../helpers/authToken";
import {
  createResource,
  deleteResource,
  fetchResources,
  updateResource,
} from "../helpers/resourcesApi";

export const resourcesQueryOptions = (club = getCurrentClub()) =>
  queryOptions({
    queryKey: ["resources", club],
    queryFn: fetchResources,
    enabled: !!club,
  });

export const useResourcesQuery = () => useQuery(resourcesQueryOptions());

// No cache update on success - resources_updated (SSE) is the source of truth.
export const useCreateResourceMutation = () =>
  useMutation({ mutationFn: createResource });

export const useUpdateResourceMutation = () =>
  useMutation({ mutationFn: updateResource });

export const useDeleteResourceMutation = () =>
  useMutation({ mutationFn: deleteResource });
