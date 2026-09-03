import { getMappedItemsToUpdate } from "../helpers/dragNDrop";
import { applyTaskUpdates, getRowCompactionUpdates } from "../helpers/tasks";
import { useAppContext } from "./useAppContext";
import { useReorderTasksMutation } from "../queries/tasks";

export const useMoveTasksCell = () => {
  const reorderTasksMutation = useReorderTasksMutation();
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

    // Can leave a row gap - see getRowCompactionUpdates. Computed post-move.
    const compactionUpdates = getRowCompactionUpdates(updatedTasksListWithChanges);

    setTasks(applyTaskUpdates(updatedTasksListWithChanges, compactionUpdates));

    reorderTasksMutation.mutate([...mappedItemsToUpdate, ...compactionUpdates]);
  };
};
