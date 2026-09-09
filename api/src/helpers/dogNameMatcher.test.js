import { describe, expect, it } from "vitest";
import { matchDogNames } from "./dogNameMatcher.js";

const CLUB_DOGS = [
  { _id: "dog1", name: "Rio" },
  { _id: "dog2", name: "Loki" },
  { _id: "dog3", name: "Bajzel" },
];

describe("matchDogNames", () => {
  it("auto-matches an exact name", () => {
    const [result] = matchDogNames(["Rio"], CLUB_DOGS);

    expect(result.matchedDogId).toBe("dog1");
  });

  it("auto-matches a name that's case-different, otherwise exact", () => {
    const [result] = matchDogNames(["rio"], CLUB_DOGS);

    expect(result.matchedDogId).toBe("dog1");
  });

  it("auto-matches a one-character typo", () => {
    const [result] = matchDogNames(["Loky"], CLUB_DOGS);

    expect(result.matchedDogId).toBe("dog2");
  });

  it("leaves a name with no close club dog unmatched, for manual review", () => {
    const [result] = matchDogNames(["Totally Different Name"], CLUB_DOGS);

    expect(result.matchedDogId).toBeNull();
    expect(result.suggestions[0].name).toBeDefined();
  });

  it("leaves an ambiguous name (tied between two dogs) unmatched", () => {
    const dogs = [{ _id: "a", name: "Rex" }, { _id: "b", name: "Rox" }];
    const [result] = matchDogNames(["Rax"], dogs);

    expect(result.matchedDogId).toBeNull();
    expect(result.suggestions).toHaveLength(2);
  });

  it("leaves a blank name unmatched rather than picking an arbitrary closest dog", () => {
    const [result] = matchDogNames([""], CLUB_DOGS);

    expect(result.matchedDogId).toBeNull();
  });

  it("matches each name in the input list independently", () => {
    const results = matchDogNames(["Rio", "Loki", "Bajzel"], CLUB_DOGS);

    expect(results.map((r) => r.matchedDogId)).toEqual(["dog1", "dog2", "dog3"]);
  });
});
