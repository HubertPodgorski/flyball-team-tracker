import { describe, expect, it } from "vitest";
import { matchSortableDogs } from "./sortableDogs";
import { Dog } from "./types";

const dogA = { _id: "a" } as Dog;
const dogB = { _id: "b" } as Dog;

describe("matchSortableDogs", () => {
  it("pairs every item with its matching dog, preserving order and index", () => {
    const result = matchSortableDogs([{ id: "a" }, { id: "b" }], [dogA, dogB]);

    expect(result).toEqual([
      { dog: dogA, index: 0 },
      { dog: dogB, index: 1 },
    ]);
  });

  // The exact production crash: an SSE-driven `dogs` update can land a tick
  // before the sortable's local `items` state (synced via `useEffect`) has
  // caught up, so `items` briefly references an id no longer in `dogs` -
  // in both directions (a dog just removed, or `items` not yet grown to
  // include a dog that was just added).
  it("drops an item whose id is no longer present in dogs, instead of a null placeholder", () => {
    const result = matchSortableDogs([{ id: "a" }, { id: "removed" }], [dogA]);

    expect(result).toEqual([{ dog: dogA, index: 0 }]);
    // No entry may ever carry a falsy `dog` - react-sortablejs clones each
    // child via React.cloneElement, which throws on `null`/`undefined`.
    expect(result.every(({ dog }) => !!dog)).toBe(true);
  });

  it("drops an item whose dog has not been added to `items` yet", () => {
    const result = matchSortableDogs([{ id: "a" }], [dogA, dogB]);

    expect(result).toEqual([{ dog: dogA, index: 0 }]);
  });

  it("returns an empty array for an empty items list", () => {
    expect(matchSortableDogs([], [dogA])).toEqual([]);
  });
});
