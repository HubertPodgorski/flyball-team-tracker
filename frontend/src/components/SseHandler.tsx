import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "../hooks/useAuthContext";
import { useCurrentClub } from "../hooks/useCurrentClub";
import { apiSuffix } from "../helpers/apiCall";
import { getAuthToken } from "../helpers/authToken";
import { teamsQueryOptions } from "../queries/teams";
import { crossPassesQueryOptions } from "../queries/crossPasses";
import { dogTasksQueryOptions } from "../queries/dogTasks";
import { usersQueryOptions } from "../queries/users";
import { eventsQueryOptions } from "../queries/events";
import { tasksQueryOptions } from "../queries/tasks";
import { dogsQueryOptions } from "../queries/dogs";
import { CrossPass, Dog, DogTask, Event, Task, Team, User } from "../helpers/types";

// Live updates for entities migrated off socket.io.
const SseHandler = () => {
  const { user, setUserDogs } = useAuthContext();
  const queryClient = useQueryClient();
  const club = useCurrentClub();

  // Read fresh inside event listeners without making the connection effect
  // below depend on the whole `user` object - see the comment on that
  // effect's dependency array for why that distinction matters here.
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const token = getAuthToken();

    if (!token) return;

    const source = new EventSource(`${apiSuffix}/stream?token=${token}`);

    // A (re)connect (login/logout/club-switch/dropped-connection) resyncs everything, not just the mounted page's own queries.
    source.addEventListener("open", () => {
      queryClient.invalidateQueries();
    });

    source.addEventListener("teams_updated", (event: MessageEvent) => {
      const teams: Team[] = JSON.parse(event.data);

      queryClient.setQueryData(teamsQueryOptions().queryKey, teams);
    });

    source.addEventListener("cross_passes_updated", (event: MessageEvent) => {
      const crossPasses: CrossPass[] = JSON.parse(event.data);

      queryClient.setQueryData(crossPassesQueryOptions().queryKey, crossPasses);
    });

    source.addEventListener("dog_tasks_updated", (event: MessageEvent) => {
      const dogTasks: DogTask[] = JSON.parse(event.data);

      queryClient.setQueryData(dogTasksQueryOptions().queryKey, dogTasks);
    });

    source.addEventListener("users_updated", (event: MessageEvent) => {
      const users: User[] = JSON.parse(event.data);

      queryClient.setQueryData(usersQueryOptions().queryKey, users);

      // Keep AuthContext's own user.dogs in sync too - e.g. someone (or the
      // user themselves) assigning a new dog via user management otherwise
      // only lands in the `users` query cache, invisible on Settings/My Dogs
      // until the next login. Mirrors the `dogs_updated` handler below,
      // which has the opposite blind spot (can refresh/drop assigned dogs,
      // but can't ever pick up a newly-assigned one).
      const updatedSelf = users.find(({ _id }) => _id === userRef.current!._id);

      if (updatedSelf) setUserDogs(updatedSelf.dogs);
    });

    source.addEventListener("events_updated", (event: MessageEvent) => {
      const events: Event[] = JSON.parse(event.data);

      queryClient.setQueryData(eventsQueryOptions().queryKey, events);
    });

    source.addEventListener("tasks_updated", (event: MessageEvent) => {
      const tasks: Task[] = JSON.parse(event.data);

      queryClient.setQueryData(tasksQueryOptions().queryKey, tasks);
    });

    source.addEventListener("dogs_updated", (event: MessageEvent) => {
      const dogs: Dog[] = JSON.parse(event.data);

      queryClient.setQueryData(dogsQueryOptions().queryKey, dogs);

      // Keep AuthContext's user.dogs (a denormalized copy) in sync too.
      const userDogIds = userRef.current!.dogs.map(({ _id }) => _id);
      setUserDogs(dogs.filter(({ _id }) => userDogIds.includes(_id)));
    });

    return () => source.close();
    // Not the whole `user` object - setUserDogs churns its identity. `club` added: a club-switch keeps the same `_id`, so reconnect needs it too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, club, queryClient, setUserDogs]);

  return null;
};

export default SseHandler;
