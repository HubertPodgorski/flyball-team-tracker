import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "../hooks/useAuthContext";
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
    // Deliberately `user?._id`, not `user`: this handler's own setUserDogs
    // calls (both above and in users_updated) change the user object's
    // identity on every dogs/self update, and depending on the whole object
    // would tear down and recreate the connection every single time. That
    // reconnect isn't just wasteful - it's a real bug: the brief gap while
    // the old connection closes and the new one re-registers can silently
    // drop a broadcast that lands in that window (e.g. deleting a dog
    // broadcasts dogs_updated immediately followed by tasks_updated in the
    // same request - the first one's own setUserDogs call was tearing down
    // the connection just in time to lose the second). _id only changes on
    // an actual login/logout/user-switch, which is when this really should
    // reconnect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, queryClient, setUserDogs]);

  return null;
};

export default SseHandler;
