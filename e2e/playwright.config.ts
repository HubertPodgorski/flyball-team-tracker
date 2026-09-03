import { defineConfig } from "@playwright/test";

const FRONTEND_PORT = 3100;
const API_PORT = 4101;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  // A small CI-only retry budget absorbs runner-environment flakiness
  // (network hiccups, etc.) without masking real failures during local
  // iteration, where retries stay off.
  retries: process.env.CI ? 1 : 0,
  // html so a failed CI run has a report worth uploading as an artifact -
  // list locally, since html's default "open a browser tab" behavior would
  // fire on every single local run otherwise.
  reporter: process.env.CI ? "html" : "list",
  timeout: 30_000,
  globalSetup: require.resolve("./global-setup"),
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: "yarn start",
    cwd: "../frontend",
    port: FRONTEND_PORT,
    env: {
      PORT: String(FRONTEND_PORT),
      VITE_HTTPS_PROXY: `http://localhost:${API_PORT}`,
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
