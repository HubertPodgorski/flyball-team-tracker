import { defineConfig } from "@playwright/test";

const FRONTEND_PORT = 3100;
const API_PORT = 4101;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
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
