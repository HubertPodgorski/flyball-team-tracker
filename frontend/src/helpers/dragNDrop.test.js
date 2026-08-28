import { describe, expect, it } from "vitest";
import {
  getMappedItemsToUpdate,
  getNewAndOldPositionIndexes,
} from "./dragNDrop";

describe("getNewAndOldPositionIndexes", () => {
  it("parses the row/column out of each droppableId and the cell out of each index", () => {
    const destination = { droppableId: "2_1", index: 3 };
    const source = { droppableId: "0_1", index: 5 };

    expect(getNewAndOldPositionIndexes(destination, source)).toEqual({
      newIndexes: { cell: 3, column: 1, row: 2 },
      oldIndexes: { cell: 5, column: 1, row: 0 },
    });
  });
});

describe("getMappedItemsToUpdate", () => {
  it("reorders items within the same column", () => {
    const taskA = { _id: "a", position: { rowIndex: 0, columnIndex: 0, positionIndex: 0 } };
    const taskB = { _id: "b", position: { rowIndex: 0, columnIndex: 0, positionIndex: 1 } };
    const taskC = { _id: "c", position: { rowIndex: 0, columnIndex: 0, positionIndex: 2 } };

    const mappedTasks = { 0: { 0: [taskA, taskB, taskC], 1: [] } };

    // Move task "a" from index 0 to index 2 within the same column.
    const destination = { droppableId: "0_0", index: 2 };
    const source = { droppableId: "0_0", index: 0 };

    const result = getMappedItemsToUpdate(destination, source, mappedTasks, "a");

    expect(result).toEqual([
      { _id: "b", position: { rowIndex: 0, columnIndex: 0, positionIndex: 0 } },
      { _id: "c", position: { rowIndex: 0, columnIndex: 0, positionIndex: 1 } },
      { _id: "a", position: { rowIndex: 0, columnIndex: 0, positionIndex: 2 } },
    ]);
  });

  it("moves an item into a different column", () => {
    const taskA = { _id: "a", position: { rowIndex: 0, columnIndex: 0, positionIndex: 0 } };
    const taskB = { _id: "b", position: { rowIndex: 0, columnIndex: 1, positionIndex: 0 } };

    const mappedTasks = { 0: { 0: [taskA], 1: [taskB] } };

    // Move task "a" out of column 0 into column 1, after task "b".
    const destination = { droppableId: "0_1", index: 1 };
    const source = { droppableId: "0_0", index: 0 };

    const result = getMappedItemsToUpdate(destination, source, mappedTasks, "a");

    expect(result).toEqual([
      { _id: "b", position: { rowIndex: 0, columnIndex: 1, positionIndex: 0 } },
      { _id: "a", position: { rowIndex: 0, columnIndex: 1, positionIndex: 1 } },
    ]);
  });
});
