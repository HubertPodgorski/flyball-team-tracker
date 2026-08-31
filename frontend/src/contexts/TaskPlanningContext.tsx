import React, { createContext, ReactNode, useState } from "react";

export interface TaskPlanningContextType {
  selectedEventId: string;
  setSelectedEventId: (eventId: string) => void;
}

export const TaskPlanningContext = createContext<
  TaskPlanningContextType | undefined
>(undefined);

// Shares the selected event between the event picker and every TaskForm.
export const TaskPlanningProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [selectedEventId, setSelectedEventId] = useState("");

  return (
    <TaskPlanningContext.Provider
      value={{ selectedEventId, setSelectedEventId }}
    >
      {children}
    </TaskPlanningContext.Provider>
  );
};
