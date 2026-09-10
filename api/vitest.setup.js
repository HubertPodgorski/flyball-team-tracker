import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { ensureClubsSeeded, refreshClubsCache } from "./src/helpers/clubs.js";

// Nothing loads .env for this process (controllers are imported directly,
// never through server.js) - any test exercising JWT signing needs this set
// to something, and a dedicated test value is more correct here anyway than
// depending on a real .env secret being present.
process.env.SECRET ??= "test-secret";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 60000);

afterEach(async () => {
  const { collections } = mongoose.connection;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

// The club list is DB-backed now - reseed it after each wipe so "TEST_TEAM" etc. stay valid clubs.
beforeEach(async () => {
  await ensureClubsSeeded();
  await refreshClubsCache();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
