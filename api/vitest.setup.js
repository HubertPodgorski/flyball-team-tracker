import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

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

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
