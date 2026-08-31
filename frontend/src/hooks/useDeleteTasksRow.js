import { applyTaskUpdates, getRowCompactionUpdates } from "../helpers/tasks";
import { useAppContext } from "./useAppContext";
import { useSocketContext } from "./useSocketContext";

export const useDeleteTasksRow = () => {
  const { socket } = useSocketContext();
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
      socket.emit("delete_task", { _id: taskId });
    });

    if (compactionUpdates.length) {
      socket.emit("update_tasks_order", { tasks: compactionUpdates });
    }
  };
};
