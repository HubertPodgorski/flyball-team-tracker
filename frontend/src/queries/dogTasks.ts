import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getCurrentClub } from "../helpers/authToken";
import {
  createDogTask,
  deleteDogTask,
  fetchDogTasks,
  updateDogTask,
} from "../helpers/dogTasksApi";

export const dogTasksQueryOptions = (club = getCurrentClub()) =>
  queryOptions({
    queryKey: ["dogTasks", club],
    queryFn: fetchDogTasks,
    enabled: !!club,
  });

export const useDogTasksQuery = () => useQuery(dogTasksQueryOptions());

// No cache update on success - dog_tasks_updated (SSE) is the source of truth.
export const useCreateDogTaskMutation = () =>
  useMutation({ mutationFn: createDogTask });

export const useUpdateDogTaskMutation = () =>
  useMutation({ mutationFn: updateDogTask });

export const useDeleteDogTaskMutation = () =>
  useMutation({ mutationFn: deleteDogTask });
