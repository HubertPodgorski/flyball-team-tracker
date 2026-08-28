export const useGetMaxRowIndex = (mappedTasks) => {
  if (!mappedTasks) {
    return 0;
  }

  return Math.max(...Object.keys(mappedTasks).map((rowIndex) => +rowIndex));
};
