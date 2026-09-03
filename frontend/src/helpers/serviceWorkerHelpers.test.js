import { afterEach, describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "./serviceWorkerHelpers";

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
