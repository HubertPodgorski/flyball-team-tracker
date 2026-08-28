import { useAppContext } from "./useAppContext";
import { useSocketContext } from "./useSocketContext";

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
  const { socket } = useSocketContext();
  const { tasks } = useAppContext();

  return (result, mappedTasks, setMappedTasks) => {
    const { destination, source } = result;

    const startIndex = Math.min(destination.index, source.index);
    const endIndex = Math.max(destination.index, source.index);

    const movingTopDown = destination.index - source.index > 0;

    if (startIndex === endIndex) return;

    let changedTasks = [];

    const newMappedTasks = Object.keys(mappedTasks).reduce(
      (newMappedTasks, stringRowKey) => {
        const rowKey = +stringRowKey;
        if (rowKey < startIndex || rowKey > endIndex) {
          return newMappedTasks;
        }

        if (rowKey === source.index) {
          changedTasks = [
            ...changedTasks,
            ...mapTasksToNewRowIndex(source.index, destination.index, tasks),
          ];

          return {
            ...newMappedTasks,
            [destination.index]: { ...mappedTasks[source.index] },
          };
        }

        const newKey = movingTopDown ? +rowKey - 1 : +rowKey + 1;

        changedTasks = [
          ...changedTasks,
          ...mapTasksToNewRowIndex(rowKey, newKey, tasks),
        ];

        return {
          ...newMappedTasks,
          [newKey]: { ...mappedTasks[rowKey] },
        };
      },
      { ...mappedTasks }
    );

    setMappedTasks(newMappedTasks);
    socket.emit("update_tasks_order", { tasks: changedTasks });
  };
};
