import { useEffect } from "react";
import { useAppContext } from "../hooks/useAppContext";
import { useSocketContext } from "../hooks/useSocketContext";
import { useAuthContext } from "../hooks/useAuthContext";

const SocketHandler = () => {
  const { socket } = useSocketContext();

  const {
    setTasks,
    setDogs,
    setEvents,
    setUsers,
    setDogTasks,
    setEventTemplates,
    setSubscriptionDetails,
  } = useAppContext();
  const { user, setUserDogs } = useAuthContext();

  useEffect(() => {
    socket.on("tasks_updated", (received) => {
      setTasks(received);
    });

    socket.on("users_updated", (received) => {
      setUsers(received);
    });

    socket.on("dogs_updated", (received) => {
      setDogs(received);

      // sync dog changes to user dogs
      const userDogIds = user.dogs.map(({ _id }) => _id);
      const userDogs = received.filter(({ _id }) => userDogIds.includes(_id));
      setUserDogs(userDogs);
    });

    socket.on("events_updated", (received) => {
      setEvents(received);
    });

    socket.on("dog_tasks_updated", (received) => {
      setDogTasks(received);
    });

    socket.on("event_templates_updated", (received) => {
      setEventTemplates(received);
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    const userLocalstorage = localStorage.getItem("user");

    if (!user || !userLocalstorage || !JSON.parse(userLocalstorage).token) {
      setDogs([]);
      setEvents([]);
      setTasks([]);
      setUsers([]);
      setDogTasks([]);
      setEventTemplates([]);

      return;
    }

    socket.emit("get_all_dogs", (dogs) => {
      setDogs(dogs);
    });

    socket.emit("get_all_events", (events) => {
      setEvents(events);
    });

    socket.emit("get_all_tasks", (tasks) => {
      setTasks(tasks);
    });

    socket.emit("get_all_users", (users) => {
      setUsers(users);
    });

    socket.emit("get_all_dog_tasks", (dogTasks) => {
      setDogTasks(dogTasks);
    });

    socket.emit("get_all_event_templates", (eventTemplates) => {
      setEventTemplates(eventTemplates);
    });

    socket.emit("get_subscription_details", (subscriptionDetails) => {
      setSubscriptionDetails(subscriptionDetails);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, socket]);

  return null;
};

export default SocketHandler;
