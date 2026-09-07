import { describe, expect, it, beforeEach } from "vitest";
import { dismissPushPrompt, isPushPromptDismissed } from "./pushNotificationsPrompt";

// See authToken.test.ts for why localStorage is stubbed by hand here -
// this project's vitest environment is "node", not jsdom.
const stubLocalStorage = () => {
  let store: Record<string, string> = {};

  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  };
};

describe("isPushPromptDismissed / dismissPushPrompt", () => {
  beforeEach(() => {
    stubLocalStorage();
  });

  it("is not dismissed before dismissPushPrompt is ever called", () => {
    expect(isPushPromptDismissed()).toBe(false);
  });

  it("is dismissed after dismissPushPrompt is called", () => {
    dismissPushPrompt();

    expect(isPushPromptDismissed()).toBe(true);
  });
});
