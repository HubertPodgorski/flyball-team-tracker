import React, { createContext, useState } from "react";
import { AppContextType } from "./types";

export const AppContext = createContext<AppContextType | undefined>(
  undefined
);

// TODO: start using reducers and actions
export const AppContextProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [dogTasks, setDogTasks] = useState([]);
  const [eventTemplates, setEventTemplates] = useState([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState();
  const [crossPasses, setCrossPasses] = useState([]);

  return (
    <AppContext.Provider
      value={{
        tasks,
        setTasks,
        dogs,
        setDogs,
        events,
        setEvents,
        users,
        setUsers,
        dogTasks,
        setDogTasks,
        eventTemplates,
        setEventTemplates,
        subscriptionDetails,
        setSubscriptionDetails,
        crossPasses,
        setCrossPasses,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
