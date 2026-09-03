import { applyTaskUpdates, getRowCompactionUpdates } from "../helpers/tasks";
import { useAppContext } from "./useAppContext";
import { useDeleteTaskMutation, useReorderTasksMutation } from "../queries/tasks";

export const useDeleteTasksRow = () => {
  const deleteTaskMutation = useDeleteTaskMutation();
  const reorderTasksMutation = useReorderTasksMutation();
  const { tasks, setTasks } = useAppContext();

  return (rowIndex) => {
    const deletedTaskIds = tasks
      .filter((task) => task.position.rowIndex === rowIndex)
      .map((task) => task._id);

    if (deletedTaskIds.length === 0) return;

    const remainingTasks = tasks.filter((task) => task.position.rowIndex !== rowIndex);

    // Can leave a row gap - see getRowCompactionUpdates.
    const compactionUpdates = getRowCompactionUpdates(remainingTasks);

    setTasks(applyTaskUpdates(remainingTasks, compactionUpdates));

    deletedTaskIds.forEach((taskId) => {
      deleteTaskMutation.mutate(taskId);
    });

    if (compactionUpdates.length) {
      reorderTasksMutation.mutate(compactionUpdates);
    }
  };
};
