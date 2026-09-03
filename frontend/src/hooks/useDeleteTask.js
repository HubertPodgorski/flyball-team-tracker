import { applyTaskUpdates, getRowCompactionUpdates } from "../helpers/tasks";
import { useAppContext } from "./useAppContext";
import { useDeleteTaskMutation, useReorderTasksMutation } from "../queries/tasks";

// Can empty out a row too - see getRowCompactionUpdates.
export const useDeleteTask = () => {
  const deleteTaskMutation = useDeleteTaskMutation();
  const reorderTasksMutation = useReorderTasksMutation();
  const { tasks, setTasks } = useAppContext();

  return (taskId) => {
    const remainingTasks = tasks.filter((task) => task._id !== taskId);

    const compactionUpdates = getRowCompactionUpdates(remainingTasks);

    setTasks(applyTaskUpdates(remainingTasks, compactionUpdates));

    deleteTaskMutation.mutate(taskId);

    if (compactionUpdates.length) {
      reorderTasksMutation.mutate(compactionUpdates);
    }
  };
};
