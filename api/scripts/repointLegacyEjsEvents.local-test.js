// Local smoke test for repointLegacyEjsEvents: boots an in-memory Mongo, seeds a synthetic "legacy" scenario (EJS
// rows already flipped to team=EJS_TEAM, but their eventId still points at a real club's own Event - exactly what
// migrateEjsToGlobalPool.js leaves behind, since it never touches the events collection), then verifies the repoint.
//
//   node scripts/repointLegacyEjsEvents.local-test.js
const { ObjectId, MongoClient } = require("mongodb");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { repointLegacyEjsEvents, EJS_TEAM } = require("./migrateEjsCore");

const assert = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);

  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${JSON.stringify(actual)}${ok ? "" : ` (expected ${JSON.stringify(expected)})`}`);

  if (!ok) process.exitCode = 1;
};

(async () => {
  const mongod = await MongoMemoryServer.create();
  const client = new MongoClient(mongod.getUri());

  try {
    await client.connect();

    const db = client.db("repoint_test");
    const events = db.collection("events");
    const entries = db.collection("competitionentries");

    // A real club's own event, already carrying EJS_TEAM rows (the exact state migrateEjsToGlobalPool.js leaves).
    const legacyEventId = new ObjectId();
    await events.insertOne({
      _id: legacyEventId,
      name: "KOZERKI 2026",
      date: "2026-09-05",
      endDate: "2026-09-06",
      type: "COMPETITION",
      team: "ULTRA_FLYBALL_TEAM",
    });
    await entries.insertMany([
      { eventId: legacyEventId, team: EJS_TEAM, teamName: "Ultra Flyball Team", dogs: [] },
      { eventId: legacyEventId, team: EJS_TEAM, teamName: "Opponent A", dogs: [] },
      { eventId: legacyEventId, team: EJS_TEAM, teamName: "Opponent B", dogs: [] },
    ]);

    // A properly superadmin-owned event - should be left completely alone.
    const properEventId = new ObjectId();
    await events.insertOne({ _id: properEventId, name: "Already Global", date: "2026-10-01", type: "COMPETITION", team: EJS_TEAM });
    await entries.insertOne({ eventId: properEventId, team: EJS_TEAM, teamName: "Some Team", dogs: [] });

    console.log("=== DRY RUN ===");
    const dry = await repointLegacyEjsEvents(db, { dryRun: true, log: console.log });
    assert("dry run finds the one legacy event", dry.legacyCount, 1);
    assert("dry run writes nothing", await events.countDocuments(), 2);
    assert("dry run leaves the legacy rows' eventId alone", await entries.countDocuments({ eventId: legacyEventId }), 3);

    console.log("\n=== APPLY ===");
    const applied = await repointLegacyEjsEvents(db, { dryRun: false, log: console.log });
    assert("repoints exactly the one legacy event", applied.repointed.length, 1);

    const twinId = new ObjectId(applied.repointed[0].to);
    const twin = await events.findOne({ _id: twinId });

    assert("the twin is a proper EJS_TEAM copy of the original's name/date", twin && { name: twin.name, date: twin.date, endDate: twin.endDate, team: twin.team }, {
      name: "KOZERKI 2026",
      date: "2026-09-05",
      endDate: "2026-09-06",
      team: EJS_TEAM,
    });

    const original = await events.findOne({ _id: legacyEventId });
    assert("the original event is completely untouched - still Ultra's own", original && { name: original.name, team: original.team }, {
      name: "KOZERKI 2026",
      team: "ULTRA_FLYBALL_TEAM",
    });

    assert("no EJS row still points at the original event", await entries.countDocuments({ eventId: legacyEventId }), 0);
    assert("all 3 rows now point at the twin", await entries.countDocuments({ eventId: twinId }), 3);
    assert("the already-proper event and its row are untouched", await entries.countDocuments({ eventId: properEventId }), 1);
    assert("total event count is now 3 (original + twin + the untouched proper one)", await events.countDocuments(), 3);

    console.log("\n=== RE-RUN (idempotency) ===");
    const second = await repointLegacyEjsEvents(db, { dryRun: false, log: () => {} });
    assert("second run finds nothing left to repoint", second.legacyCount, 0);
  } finally {
    await client.close();
    await mongod.stop();
  }

  console.log(process.exitCode ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
