import { useLayoutEffect, useState } from "react";
import { mapTasks, mapTasksForAdminPanel } from "../helpers/tasks";
import { useAppContext } from "./useAppContext";

export const useGetMappedTasks = (adminPanel, isDragging = false) => {
  const { tasks } = useAppContext();

  const [mappedTasks, setMappedTasks] = useState([]);

  // useLayoutEffect, not useEffect: this must run before the browser paints.
  // A drag ending updates `tasks` and commits a render where @hello-pangea/dnd
  // has already dropped its own drag-position transform, but `mappedTasks`
  // (derived here) hasn't been recomputed yet - with a plain useEffect that
  // stale-order frame actually paints, then gets corrected a tick later,
  // which is exactly the visible "snaps to the wrong spot, then the right
  // one" double jump on drop. useLayoutEffect flushes the corrected render
  // synchronously first, so the stale frame never paints.
  useLayoutEffect(() => {
    // Skip reconciling with incoming server/socket state while a drag is in
    // progress - swapping the Draggable list out from under an active drag
    // (e.g. another admin editing tasks mid-drag) is what @hello-pangea/dnd's
    // "add/remove a Draggable while dragging" error comes from. Once
    // isDragging flips back to false this effect re-runs and picks up
    // whatever `tasks` is at that point.
    if (isDragging) return;

    setMappedTasks(adminPanel ? mapTasksForAdminPanel(tasks) : mapTasks(tasks));
  }, [tasks, adminPanel, isDragging]);

  return { mappedTasks, setMappedTasks };
};
