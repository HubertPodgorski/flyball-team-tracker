import { useEffect, useLayoutEffect, useState } from "react";
import {
  applyTaskUpdates,
  getRowCompactionUpdates,
  mapTasks,
  mapTasksForAdminPanel,
} from "../helpers/tasks";
import { useAppContext } from "./useAppContext";
import { useReorderTasksMutation, useTasksQuery } from "../queries/tasks";

export const useGetMappedTasks = (adminPanel, isDragging = false) => {
  const { tasks, setTasks } = useAppContext();
  const { data: queriedTasks } = useTasksQuery();
  const reorderTasksMutation = useReorderTasksMutation();

  const [mappedTasks, setMappedTasks] = useState([]);

  // Owning the query here (not in an app-root singleton) means it mounts
  // fresh, with the current club, every time a Tasks page is actually visited.
  useEffect(() => {
    setTasks(queriedTasks ?? []);
  }, [queriedTasks, setTasks]);

  // useLayoutEffect so a reorder never paints a stale frame first.
  useLayoutEffect(() => {
    // Don't yank the list out from under an active drag.
    if (isDragging) return;

    // Self-heals row gaps regardless of cause - see getRowCompactionUpdates.
    const compactionUpdates = adminPanel ? getRowCompactionUpdates(tasks) : [];

    if (compactionUpdates.length) {
      const correctedTasks = applyTaskUpdates(tasks, compactionUpdates);

      setTasks(correctedTasks);
      reorderTasksMutation.mutate(compactionUpdates);
      setMappedTasks(mapTasksForAdminPanel(correctedTasks));
      return;
    }

    setMappedTasks(adminPanel ? mapTasksForAdminPanel(tasks) : mapTasks(tasks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, adminPanel, isDragging, setTasks]);

  return { mappedTasks, setMappedTasks };
};
