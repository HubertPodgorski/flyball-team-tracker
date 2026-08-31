import { describe, expect, it } from "vitest";
import {
  applyTaskUpdates,
  getRowCompactionUpdates,
  isMyDog,
  mapTasks,
  mapTasksForAdminPanel,
} from "./tasks";

describe("mapTasks", () => {
  it("groups tasks by row and column, sorted by positionIndex", () => {
    const item1 = { _id: "1", position: { rowIndex: 0, columnIndex: 0, positionIndex: 1 } };
    const item2 = { _id: "2", position: { rowIndex: 0, columnIndex: 0, positionIndex: 0 } };
    const item3 = { _id: "3", position: { rowIndex: 1, columnIndex: 1, positionIndex: 0 } };

    expect(mapTasks([item1, item2, item3])).toEqual({
      0: { 0: [item2, item1] },
      1: { 1: [item3] },
    });
  });

  it("returns an empty object for no tasks", () => {
    expect(mapTasks([])).toEqual({});
  });
});

describe("mapTasksForAdminPanel", () => {
  it("fills every row up to the max row index with empty columns 0 and 1", () => {
    const item1 = { _id: "1", position: { rowIndex: 0, columnIndex: 0, positionIndex: 0 } };

    expect(mapTasksForAdminPanel([item1])).toEqual({
      0: { 0: [item1], 1: [] },
      1: { 0: [], 1: [] },
    });
  });

  it("still produces two empty rows for an empty task list", () => {
    // maxRowIndex defaults to 0, and the fill loop runs through maxRowIndex + 1 inclusive.
    expect(mapTasksForAdminPanel([])).toEqual({
      0: { 0: [], 1: [] },
      1: { 0: [], 1: [] },
    });
  });
});

describe("getRowCompactionUpdates", () => {
  const task = (id, rowIndex) => ({ _id: id, position: { rowIndex, columnIndex: 0, positionIndex: 0 } });

  it("returns no updates when rowIndex values are already gap-free", () => {
    expect(getRowCompactionUpdates([task("1", 0), task("2", 1), task("3", 1)])).toEqual([]);
  });

  it("returns no updates for an empty task list", () => {
    expect(getRowCompactionUpdates([])).toEqual([]);
  });

  it("closes a gap left by an emptied-out middle row", () => {
    // row 1 has no tasks - rows 0 and 2 are filled
    const result = getRowCompactionUpdates([task("1", 0), task("2", 2), task("3", 2)]);

    expect(result).toEqual([
      { _id: "2", position: { rowIndex: 1, columnIndex: 0, positionIndex: 0 } },
      { _id: "3", position: { rowIndex: 1, columnIndex: 0, positionIndex: 0 } },
    ]);
  });

  it("only includes tasks whose rowIndex actually changes", () => {
    // row 0 is already correct and shouldn't show up in the update list
    const result = getRowCompactionUpdates([task("1", 0), task("2", 3)]);

    expect(result).toEqual([{ _id: "2", position: { rowIndex: 1, columnIndex: 0, positionIndex: 0 } }]);
  });
});

describe("applyTaskUpdates", () => {
  const task = (id, rowIndex) => ({ _id: id, position: { rowIndex, columnIndex: 0, positionIndex: 0 } });

  it("merges a matching update's fields into that task", () => {
    const result = applyTaskUpdates(
      [task("1", 0), task("2", 1)],
      [{ _id: "2", position: { rowIndex: 5, columnIndex: 0, positionIndex: 0 } }]
    );

    expect(result).toEqual([task("1", 0), task("2", 5)]);
  });

  it("leaves a task with no matching update untouched", () => {
    const result = applyTaskUpdates(
      [task("1", 0)],
      [{ _id: "999", position: { rowIndex: 9, columnIndex: 0, positionIndex: 0 } }]
    );

    expect(result).toEqual([task("1", 0)]);
  });

  it("returns the same array reference when there are no updates", () => {
    const tasks = [task("1", 0)];

    expect(applyTaskUpdates(tasks, [])).toBe(tasks);
  });
});

describe("isMyDog", () => {
  const userDogs = [{ _id: "a" }, { _id: "b" }];

  it("returns true when the dog is in the user's dogs", () => {
    expect(isMyDog("a", userDogs)).toBe(true);
  });

  it("returns false when the dog isn't in the user's dogs", () => {
    expect(isMyDog("z", userDogs)).toBe(false);
  });
});
