import { useAppContext } from "./useAppContext";
import { useReorderTasksMutation } from "../queries/tasks";

const mapTasksToNewRowIndex = (oldRowIndex, newRowIndex, tasks) =>
  tasks.reduce((oldTasks, currentTask) => {
    if (currentTask.position.rowIndex === oldRowIndex) {
      return [
        ...oldTasks,
        {
          _id: currentTask._id,
          position: { ...currentTask.position, rowIndex: newRowIndex },
        },
      ];
    }

    return oldTasks;
  }, []);

export const useMoveTasksRow = () => {
  const reorderTasksMutation = useReorderTasksMutation();
  const { tasks, setTasks } = useAppContext();

  return (result) => {
    const { destination, source } = result;

    if (!destination) return;

    const startIndex = Math.min(destination.index, source.index);
    const endIndex = Math.max(destination.index, source.index);

    if (startIndex === endIndex) return;

    const movingTopDown = destination.index - source.index > 0;

    // Every row index between source and destination shifts by one to make
    // room, except the moved row itself which jumps straight to
    // destination.index - this only needs the numeric range, not
    // mappedTasks, so there's a single source of truth for the resulting
    // task order (mapTasksForAdminPanel deriving it from `tasks`) instead of
    // this hook computing its own, separately-derived mappedTasks that could
    // visibly disagree with it once the server's confirmation lands.
    let changedTasks = [];

    for (let rowKey = startIndex; rowKey <= endIndex; rowKey++) {
      const newKey =
        rowKey === source.index
          ? destination.index
          : movingTopDown
            ? rowKey - 1
            : rowKey + 1;

      changedTasks = [
        ...changedTasks,
        ...mapTasksToNewRowIndex(rowKey, newKey, tasks),
      ];
    }

    const updatedTasksListWithChanges = tasks.map((task) => {
      const updatedTaskFound = changedTasks.find(
        ({ _id: changedTaskId }) => changedTaskId === task._id
      );

      if (!updatedTaskFound) return task;

      return { ...task, ...updatedTaskFound };
    });

    setTasks(updatedTasksListWithChanges);

    reorderTasksMutation.mutate(changedTasks);
  };
};
