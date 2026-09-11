// One-off, run AFTER migrateEjsToGlobalPool.js: repoint any EJS row still pointing at a real club's own Event
// (legacy, from before this pool model existed) onto a fresh EJS_TEAM twin. The club's original event is untouched.
// Logic lives in migrateEjsCore.js (also exercised by repointLegacyEjsEvents.local-test.js).
// Dry run: DRY_RUN=1 node scripts/repointLegacyEjsEvents.js   |   Apply: node scripts/repointLegacyEjsEvents.js
require("dotenv").config();
const { MongoClient } = require("mongodb");
const { repointLegacyEjsEvents } = require("./migrateEjsCore");

const dryRun = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");

(async () => {
  const client = new MongoClient(process.env.MONGO_URL);

  await client.connect();

  await repointLegacyEjsEvents(client.db(), { dryRun, log: console.log });

  await client.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
