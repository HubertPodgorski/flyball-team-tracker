import { afterEach, describe, expect, it, vi } from "vitest";
import { registerServiceWorker, subscribe } from "./serviceWorkerHelpers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("registerServiceWorker", () => {
  it("registers the service worker at the base URL when supported", async () => {
    const register = vi.fn().mockResolvedValue("registration");
    vi.stubGlobal("navigator", { serviceWorker: { register } });

    const result = await registerServiceWorker();

    expect(register).toHaveBeenCalledWith("/serviceWorker.js", { scope: "/" });
    expect(result).toBe("registration");
  });

  it("throws when the browser doesn't support service workers", async () => {
    vi.stubGlobal("navigator", {});

    await expect(registerServiceWorker()).rejects.toThrow(
      "serviceworker not supported"
    );
  });
});

describe("subscribe", () => {
  it("subscribes to push and stores the subscription details on success", async () => {
    const push = { endpoint: "https://push.example.com" };
    const subscribeToPush = vi.fn().mockResolvedValue(push);

    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: { subscribe: subscribeToPush },
        }),
      },
    });

    const setSubscriptionDetails = vi.fn();
    const socket = {
      emit: vi.fn((event, data, callback) => callback({ id: "sub-1" })),
    };

    await subscribe(socket, setSubscriptionDetails);

    expect(subscribeToPush).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true })
    );
    expect(socket.emit).toHaveBeenCalledWith(
      "save_subscription",
      push,
      expect.any(Function)
    );
    expect(setSubscriptionDetails).toHaveBeenCalledWith({ id: "sub-1" });
  });

  it("doesn't update subscription details when the server sends nothing back", async () => {
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: { subscribe: vi.fn().mockResolvedValue({}) },
        }),
      },
    });

    const setSubscriptionDetails = vi.fn();
    const socket = {
      emit: vi.fn((event, data, callback) => callback(undefined)),
    };

    await subscribe(socket, setSubscriptionDetails);

    expect(setSubscriptionDetails).not.toHaveBeenCalled();
  });
});
