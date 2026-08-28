import { spawn } from "child_process";
import { writeFileSync } from "fs";
import path from "path";
import { MongoMemoryServer } from "mongodb-memory-server";

const API_PORT = 4101;
const FRONTEND_PORT = 3100;
const RUNTIME_FILE = path.join(__dirname, ".e2e-runtime.json");

const waitForPort = async (url: string, timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new Error(`Timed out waiting for ${url} to respond`);
};

// Returning a teardown function keeps mongod/apiProcess in this same
// closure — globalTeardown would run as a separate process invocation
// and couldn't see module-level state set here.
const globalSetup = async () => {
  const mongod = await MongoMemoryServer.create();
  const mongoUrl = `${mongod.getUri()}flyball-team-tracker-e2e`;

  const apiEntry = path.join(__dirname, "../api/src/server.js");

  const apiProcess = spawn(process.execPath, [apiEntry], {
    env: {
      ...process.env,
      MONGO_URL: mongoUrl,
      PORT: String(API_PORT),
      SECRET: "e2e-test-secret",
      CORS_ORIGIN: `http://localhost:${FRONTEND_PORT}`,
    },
    stdio: "inherit",
  });

  await waitForPort(`http://localhost:${API_PORT}/`, 30_000);

  writeFileSync(RUNTIME_FILE, JSON.stringify({ mongoUrl }));

  return async () => {
    apiProcess.kill();
    await mongod.stop();
  };
};

export default globalSetup;
