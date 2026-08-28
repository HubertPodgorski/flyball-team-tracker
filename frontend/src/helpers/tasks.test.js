import { describe, expect, it } from "vitest";
import { isMyDog, mapTasks, mapTasksForAdminPanel } from "./tasks";

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

describe("isMyDog", () => {
  const userDogs = [{ _id: "a" }, { _id: "b" }];

  it("returns true when the dog is in the user's dogs", () => {
    expect(isMyDog("a", userDogs)).toBe(true);
  });

  it("returns false when the dog isn't in the user's dogs", () => {
    expect(isMyDog("z", userDogs)).toBe(false);
  });
});
