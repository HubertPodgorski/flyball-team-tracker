import { useEffect } from "react";
import { useAppContext } from "../hooks/useAppContext";
import { useTasksQuery } from "../queries/tasks";

// Tasks is REST+SSE, but the task grid's own optimistic drag/drop updates
// still live in AppContext - mirror the query into it here.
const TasksContextBridge = () => {
  const { setTasks } = useAppContext();
  const { data: tasks } = useTasksQuery();

  useEffect(() => {
    setTasks(tasks ?? []);
  }, [tasks, setTasks]);

  return null;
};

export default TasksContextBridge;
