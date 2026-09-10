// Local smoke test for the EJS migration: boots an in-memory Mongo, loads a pair of JSON exports,
// runs the real migration logic, and asserts the outcome against what the input implies. No install, no prod access.
//
//   KEEP_CLUBS=ULTRA_FLYBALL_TEAM node scripts/migrateEjsToGlobalPool.local-test.js            # prod exports (default paths)
//   KEEP_CLUBS=TEST_TEAM node scripts/migrateEjsToGlobalPool.local-test.js \
//     ~/Downloads/test.competitionentries.json ~/Downloads/test.events.json                    # local `test` DB exports
const os = require("os");
const path = require("path");
const fs = require("fs");
const { EJSON } = require("bson");
const { MongoClient } = require("mongodb");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { migrateEjsToGlobalPool } = require("./migrateEjsCore");
const { computeStatsForAllOpponentDogs } = require("../src/helpers/competitionStats");

const EJS_TEAM = "__EJS__";
const keepClubs = (process.env.KEEP_CLUBS || "ULTRA_FLYBALL_TEAM").split(",").map((s) => s.trim()).filter(Boolean);

const downloads = path.join(os.homedir(), "Downloads");
const entriesFile = process.argv[2] || path.join(downloads, "flyball-team-tracker.competitionentries.json");
const eventsFile = process.argv[3] || path.join(downloads, "flyball-team-tracker.events.json");

const load = (file) => EJSON.parse(fs.readFileSync(file, "utf8"));
const oid = (v) => (v && v.$oid) || String(v);

const assert = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);

  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${JSON.stringify(actual)}${ok ? "" : ` (expected ${JSON.stringify(expected)})`}`);

  if (!ok) process.exitCode = 1;
};

(async () => {
  for (const file of [entriesFile, eventsFile]) {
    if (!fs.existsSync(file)) throw new Error(`missing export file: ${file}`);
  }

  const entryDocs = load(entriesFile);
  const eventDocs = load(eventsFile);

  // What the input implies, given keepClubs - the migration is asserted against these.
  const liveEventIds = new Set(eventDocs.map((e) => oid(e._id)));
  const kept = entryDocs.filter((r) => keepClubs.includes(r.team));
  const orphanKept = kept.filter((r) => !liveEventIds.has(oid(r.eventId)));
  const survivors = kept.filter((r) => liveEventIds.has(oid(r.eventId)));
  const expected = {
    droppedOtherClubs: entryDocs.filter((r) => !keepClubs.includes(r.team) && r.team !== EJS_TEAM).length,
    droppedOrphans: orphanKept.length,
    moved: survivors.length,
    mappingsCreated: new Set(survivors.filter((r) => r.ourTeam === true).map((r) => `${r.team}|${r.teamName}`)).size,
  };

  console.log("keepClubs:", keepClubs);
  console.log("input:", entryDocs.length, "entries,", eventDocs.length, "events");
  console.log("implied:", JSON.stringify(expected), "\n");

  const mongod = await MongoMemoryServer.create();
  const client = new MongoClient(mongod.getUri());

  try {
    await client.connect();

    const db = client.db("migration_test");
    const entries = db.collection("competitionentries");

    await entries.insertMany(entryDocs);
    await db.collection("events").insertMany(eventDocs);

    console.log("=== MIGRATION (apply) ===");
    const report = await migrateEjsToGlobalPool(db, { dryRun: false, keepClubs, log: console.log });

    console.log("\n=== ASSERTIONS ===");
    assert("dropped other clubs", report.droppedOtherClubs, expected.droppedOtherClubs);
    assert("dropped orphans", report.droppedOrphans, expected.droppedOrphans);
    assert("entries moved to __EJS__", report.moved, expected.moved);
    assert("mappings created", report.mappingsCreated, expected.mappingsCreated);

    const remaining = await entries.find({}).toArray();
    assert("every remaining row is in the pool", [...new Set(remaining.map((r) => r.team))], [EJS_TEAM]);
    assert("no ourTeam:true left", remaining.filter((r) => r.ourTeam === true).length, 0);
    assert("total remaining", remaining.length, expected.moved);
    assert("no absent/null lineupKey", remaining.filter((r) => r.lineupKey === undefined || r.lineupKey === null).length, 0);

    const mapRows = await db.collection("ejsteammappings").find({}).sort({ ejsTeamName: 1 }).toArray();
    assert("mapping rows count", mapRows.length, expected.mappingsCreated);
    assert("mappings point at a kept club", [...new Set(mapRows.map((r) => r.club))].sort(), [...new Set(mapRows.map((r) => r.club))].filter((c) => keepClubs.includes(c)).sort());
    console.log("     ", mapRows.map((r) => `${r.ejsTeamName} -> ${r.club}`));

    // Stats sanity: default-scope query for one competition, the mapped names -> non-empty dog stats.
    const myTeamNames = mapRows.map((r) => r.ejsTeamName);
    const oneEventId = (await entries.distinct("eventId"))[0];
    const scoped = await entries.find({ eventId: oneEventId, team: EJS_TEAM, teamName: { $in: myTeamNames } }).toArray();
    const dogStats = computeStatsForAllOpponentDogs(scoped);

    console.log(`\nsample competition: ${scoped.length} of our rows, ${dogStats.length} dogs with stats`);
    console.log("first 3:", dogStats.slice(0, 3).map((d) => `${d.name} (${d.totalPasses} passes, ${d.faultCount} faults)`));
    assert("sample competition yields dog stats", dogStats.length > 0, true);

    console.log("\n=== RE-RUN (idempotency) ===");
    const second = await migrateEjsToGlobalPool(db, { dryRun: false, keepClubs, log: () => {} });
    assert("second run is a no-op", [second.droppedOtherClubs, second.droppedOrphans, second.moved], [0, 0, 0]);
  } finally {
    await client.close();
    await mongod.stop();
  }

  console.log(process.exitCode ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
