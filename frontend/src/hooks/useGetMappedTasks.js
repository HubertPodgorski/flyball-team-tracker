import { useEffect, useState } from "react";
import { mapTasks, mapTasksForAdminPanel } from "../helpers/tasks";
import { useAppContext } from "./useAppContext";

export const useGetMappedTasks = (adminPanel) => {
  const { tasks } = useAppContext();

  const [mappedTasks, setMappedTasks] = useState([]);

  useEffect(() => {
    setMappedTasks(adminPanel ? mapTasksForAdminPanel(tasks) : mapTasks(tasks));
  }, [tasks, adminPanel]);

  return { mappedTasks, setMappedTasks };
};
