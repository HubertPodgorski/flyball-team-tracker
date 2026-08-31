import { applyTaskUpdates, getRowCompactionUpdates } from "../helpers/tasks";
import { useAppContext } from "./useAppContext";
import { useSocketContext } from "./useSocketContext";

// Can empty out a row too - see getRowCompactionUpdates.
export const useDeleteTask = () => {
  const { socket } = useSocketContext();
  const { tasks, setTasks } = useAppContext();

  return (taskId) => {
    const remainingTasks = tasks.filter((task) => task._id !== taskId);

    const compactionUpdates = getRowCompactionUpdates(remainingTasks);

    setTasks(applyTaskUpdates(remainingTasks, compactionUpdates));

    socket.emit("delete_task", { _id: taskId });

    if (compactionUpdates.length) {
      socket.emit("update_tasks_order", { tasks: compactionUpdates });
    }
  };
};
