// One-off: fold ULTRA_FLYBALL_TEAM's pre-existing CompetitionEntry rows into the global EJS pool, drop everything else.
// Logic lives in migrateEjsCore.js (also exercised by migrateEjsToGlobalPool.local-test.js).
// Dry run: DRY_RUN=1 node scripts/migrateEjsToGlobalPool.js   |   Apply: node scripts/migrateEjsToGlobalPool.js
require("dotenv").config();
const { MongoClient } = require("mongodb");
const { migrateEjsToGlobalPool } = require("./migrateEjsCore");

const dryRun = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");

(async () => {
  const client = new MongoClient(process.env.MONGO_URL);

  await client.connect();

  await migrateEjsToGlobalPool(client.db(), { dryRun, log: console.log });

  await client.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
