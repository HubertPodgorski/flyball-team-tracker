import { useLayoutEffect, useState } from "react";
import {
  applyTaskUpdates,
  getRowCompactionUpdates,
  mapTasks,
  mapTasksForAdminPanel,
} from "../helpers/tasks";
import { useAppContext } from "./useAppContext";
import { useSocketContext } from "./useSocketContext";

export const useGetMappedTasks = (adminPanel, isDragging = false) => {
  const { tasks, setTasks } = useAppContext();
  const { socket } = useSocketContext();

  const [mappedTasks, setMappedTasks] = useState([]);

  // useLayoutEffect so a reorder never paints a stale frame first.
  useLayoutEffect(() => {
    // Don't yank the list out from under an active drag.
    if (isDragging) return;

    // Self-heals row gaps regardless of cause - see getRowCompactionUpdates.
    const compactionUpdates = adminPanel ? getRowCompactionUpdates(tasks) : [];

    if (compactionUpdates.length) {
      const correctedTasks = applyTaskUpdates(tasks, compactionUpdates);

      setTasks(correctedTasks);
      socket.emit("update_tasks_order", { tasks: compactionUpdates });
      setMappedTasks(mapTasksForAdminPanel(correctedTasks));
      return;
    }

    setMappedTasks(adminPanel ? mapTasksForAdminPanel(tasks) : mapTasks(tasks));
  }, [tasks, adminPanel, isDragging, setTasks, socket]);

  return { mappedTasks, setMappedTasks };
};
