import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getCurrentClub } from "../helpers/authToken";
import {
  copyTasksFromPreviousSession,
  createTask,
  deleteTask,
  fetchTasks,
  reorderTasks,
  updateTask,
} from "../helpers/tasksApi";

// eventId scopes the board to one session; "none" is the default board; omitted means every task in the club (the feature-gate check in Features.tsx).
export const tasksQueryOptions = (eventId?: string, club = getCurrentClub()) =>
  queryOptions({
    queryKey: eventId ? ["tasks", club, eventId] : ["tasks", club],
    queryFn: () => fetchTasks(eventId),
    enabled: !!club,
  });

export const useTasksQuery = (eventId?: string) => useQuery(tasksQueryOptions(eventId));

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

export const useCopyTasksFromPreviousMutation = () =>
  useMutation({ mutationFn: copyTasksFromPreviousSession });
