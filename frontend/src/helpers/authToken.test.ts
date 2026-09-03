import { describe, expect, it, beforeEach } from "vitest";
import { getCurrentClub } from "./authToken";

const base64url = (obj: object) => btoa(JSON.stringify(obj));

const setToken = (payload: object) => {
  const token = `header.${base64url(payload)}.signature`;

  (globalThis as any).localStorage = {
    getItem: () => JSON.stringify({ token }),
  };
};

describe("getCurrentClub", () => {
  beforeEach(() => {
    delete (globalThis as any).localStorage;
  });

  it("reads the new `club` claim", () => {
    setToken({ club: "TEST_TEAM" });

    expect(getCurrentClub()).toBe("TEST_TEAM");
  });

  it("falls back to the old `team` claim for a pre-rename token", () => {
    setToken({ team: "TEST_TEAM" });

    expect(getCurrentClub()).toBe("TEST_TEAM");
  });
});
