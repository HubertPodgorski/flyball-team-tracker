import { useContext } from "react";
import {
  TaskPlanningContext,
  TaskPlanningContextType,
} from "../contexts/TaskPlanningContext";

export const useTaskPlanningContext = (): TaskPlanningContextType => {
  const context = useContext(TaskPlanningContext);

  if (context === undefined) {
    throw new Error(
      "useTaskPlanningContext must be used within a TaskPlanningProvider"
    );
  }

  return context;
};
