import React, { createContext, useState } from "react";
import { AppContextType } from "./types";

export const AppContext = createContext<AppContextType | undefined>(
  undefined
);

// Only `tasks` is left - see TasksContextBridge.tsx for why it still needs
// its own mirrored state instead of reading useTasksQuery() directly.
export const AppContextProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);

  return (
    <AppContext.Provider value={{ tasks, setTasks }}>
      {children}
    </AppContext.Provider>
  );
};
