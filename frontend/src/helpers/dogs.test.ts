import { describe, expect, it } from "vitest";
import { resolveDogsByIds } from "./dogs";

describe("resolveDogsByIds", () => {
  const dogs = [
    { _id: "1", name: "Fido" },
    { _id: "2", name: "Rex" },
  ];

  it("resolves ids to their matching dog objects, in the given order", () => {
    expect(resolveDogsByIds(["2", "1"], dogs)).toEqual([
      { _id: "2", name: "Rex" },
      { _id: "1", name: "Fido" },
    ]);
  });

  it("drops ids that don't match any dog", () => {
    expect(resolveDogsByIds(["1", "missing"], dogs)).toEqual([
      { _id: "1", name: "Fido" },
    ]);
  });

  it("returns an empty array for no ids", () => {
    expect(resolveDogsByIds([], dogs)).toEqual([]);
  });
});
