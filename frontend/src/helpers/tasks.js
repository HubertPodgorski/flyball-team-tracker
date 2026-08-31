export const mapTasks = (rawTasks) =>
  rawTasks.reduce((tasksRows, item) => {
    const { rowIndex, columnIndex } = item.position;

    if (!tasksRows[rowIndex]) {
      return { ...tasksRows, [rowIndex]: { [columnIndex]: [item] } };
    } else {
      const newTaskRowsAtIndex = tasksRows[rowIndex];

      if (!newTaskRowsAtIndex[columnIndex]) {
        newTaskRowsAtIndex[columnIndex] = [item];
      } else {
        const newTasksAtColumnIndex = [
          ...newTaskRowsAtIndex[columnIndex],
          item,
        ];

        newTaskRowsAtIndex[columnIndex] = newTasksAtColumnIndex.sort(
          (itemA, itemB) =>
            itemA.position.positionIndex - itemB.position.positionIndex
        );
      }

      return { ...tasksRows, [rowIndex]: newTaskRowsAtIndex };
    }
  }, {});

export const mapTasksForAdminPanel = (rawTasks) => {
  let maxRowIndex = 0;

  const reducedTasks = rawTasks.reduce((tasksRows, item) => {
    const { rowIndex, columnIndex } = item.position;

    if (rowIndex > maxRowIndex) {
      maxRowIndex = rowIndex;
    }

    if (!tasksRows[rowIndex]) {
      const newColumnAtRow = {
        [columnIndex]: [item],
      };

      return {
        ...tasksRows,
        [rowIndex]: { 0: [], 1: [], ...newColumnAtRow },
      };
    } else {
      const newTaskRowsAtIndex = tasksRows[rowIndex];

      if (!newTaskRowsAtIndex[columnIndex]) {
        newTaskRowsAtIndex[columnIndex] = [item];
      } else {
        const newTasksAtColumnIndex = [
          ...newTaskRowsAtIndex[columnIndex],
          item,
        ];

        newTaskRowsAtIndex[columnIndex] = newTasksAtColumnIndex.sort(
          (itemA, itemB) =>
            itemA.position.positionIndex - itemB.position.positionIndex
        );
      }

      return { ...tasksRows, [rowIndex]: newTaskRowsAtIndex };
    }
  }, {});

  let newReducedTasks = {};

  const emptyRow = { 0: [], 1: [] };
  for (let loopRowIndex = 0; loopRowIndex <= maxRowIndex + 1; loopRowIndex++) {
    newReducedTasks = { ...newReducedTasks, [loopRowIndex]: emptyRow };
  }

  newReducedTasks = { ...newReducedTasks, ...reducedTasks };

  return newReducedTasks;
};

export const isMyDog = (dogId, userDogs) =>
  userDogs.some(({ _id }) => _id === dogId);

// Renumbers rowIndex to close gaps, so only the trailing row is ever empty. Returns [] when there's nothing to fix.
export const getRowCompactionUpdates = (tasks) => {
  const occupiedRowIndices = [...new Set(tasks.map(({ position }) => position.rowIndex))].sort(
    (a, b) => a - b
  );

  const hasGap = occupiedRowIndices.some((rowIndex, index) => rowIndex !== index);
  if (!hasGap) return [];

  const rowIndexRemap = new Map(
    occupiedRowIndices.map((oldRowIndex, newRowIndex) => [oldRowIndex, newRowIndex])
  );

  return tasks
    .filter((task) => rowIndexRemap.get(task.position.rowIndex) !== task.position.rowIndex)
    .map((task) => ({
      _id: task._id,
      position: { ...task.position, rowIndex: rowIndexRemap.get(task.position.rowIndex) },
    }));
};

// Merges partial `{ _id, ...fields }` updates into a full tasks list by _id.
export const applyTaskUpdates = (tasks, updates) => {
  if (!updates.length) return tasks;

  return tasks.map((task) => {
    const update = updates.find(({ _id }) => _id === task._id);

    return update ? { ...task, ...update } : task;
  });
};
