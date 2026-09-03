import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getCurrentClub } from "../helpers/authToken";
import {
  createTask,
  deleteTask,
  fetchTasks,
  reorderTasks,
  updateTask,
} from "../helpers/tasksApi";

export const tasksQueryOptions = (club = getCurrentClub()) =>
  queryOptions({
    queryKey: ["tasks", club],
    queryFn: fetchTasks,
    enabled: !!club,
  });

export const useTasksQuery = () => useQuery(tasksQueryOptions());

// No cache update on success - tasks_updated (SSE) is the source of truth.
// The task grid's own optimistic updates live in AppContext, not here - see
// TasksContextBridge.tsx and the task hooks.
export const useCreateTaskMutation = () =>
  useMutation({ mutationFn: createTask });

export const useUpdateTaskMutation = () =>
  useMutation({ mutationFn: updateTask });

export const useDeleteTaskMutation = () =>
  useMutation({ mutationFn: deleteTask });

export const useReorderTasksMutation = () =>
  useMutation({ mutationFn: reorderTasks });
