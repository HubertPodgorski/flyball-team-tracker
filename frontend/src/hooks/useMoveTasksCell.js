import { getMappedItemsToUpdate } from "../helpers/dragNDrop";
import { useAppContext } from "./useAppContext";
import { useSocketContext } from "./useSocketContext";

export const useMoveTasksCell = () => {
  const { socket } = useSocketContext();
  const { tasks, setTasks } = useAppContext();

  return (result, mappedTasks) => {
    const { destination, source, draggableId } = result;

    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    const mappedItemsToUpdate = getMappedItemsToUpdate(
      destination,
      source,
      mappedTasks,
      draggableId
    );

    const updatedTasksListWithChanges = tasks.map((task) => {
      const updatedTaskFound = mappedItemsToUpdate.find(
        ({ _id: mappedTaskId }) => mappedTaskId === task._id
      );

      if (!updatedTaskFound) return task;

      return { ...task, ...updatedTaskFound };
    });

    setTasks(updatedTasksListWithChanges);

    socket.emit("update_tasks_order", { tasks: mappedItemsToUpdate });
  };
};
