import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getCurrentClub } from "../helpers/authToken";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  toggleEventDog,
  toggleEventUser,
  updateEvent,
} from "../helpers/eventsApi";

export const eventsQueryOptions = (club = getCurrentClub()) =>
  queryOptions({
    queryKey: ["events", club],
    queryFn: fetchEvents,
    enabled: !!club,
  });

export const useEventsQuery = () => useQuery(eventsQueryOptions());

// No cache update on success - events_updated (SSE) is the source of truth.
export const useCreateEventMutation = () =>
  useMutation({ mutationFn: createEvent });

export const useUpdateEventMutation = () =>
  useMutation({ mutationFn: updateEvent });

export const useDeleteEventMutation = () =>
  useMutation({ mutationFn: deleteEvent });

export const useToggleEventDogMutation = () =>
  useMutation({
    mutationFn: ({ id, dogId }: { id: string; dogId: string }) =>
      toggleEventDog(id, dogId),
  });

export const useToggleEventUserMutation = () =>
  useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      toggleEventUser(id, userId),
  });
