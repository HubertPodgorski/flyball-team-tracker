import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getCurrentClub } from "../helpers/authToken";
import {
  createDog,
  deleteDog,
  fetchDogs,
  updateDog,
} from "../helpers/dogsApi";

export const dogsQueryOptions = (club = getCurrentClub()) =>
  queryOptions({
    queryKey: ["dogs", club],
    queryFn: fetchDogs,
    enabled: !!club,
  });

export const useDogsQuery = () => useQuery(dogsQueryOptions());

// No cache update on success - dogs_updated (SSE) is the source of truth.
export const useCreateDogMutation = () =>
  useMutation({ mutationFn: createDog });

export const useUpdateDogMutation = () =>
  useMutation({ mutationFn: updateDog });

export const useDeleteDogMutation = () =>
  useMutation({ mutationFn: deleteDog });
