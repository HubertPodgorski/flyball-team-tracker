// Shared migration logic - used by migrateEjsToGlobalPool.js (real DB) and migrateEjsToGlobalPool.local-test.js
// (mongodb-memory-server + the prod JSON exports). The Compass port (migrateEjsToGlobalPool.mongosh.js) mirrors this.

const EJS_TEAM = "__EJS__";
// Prod keeps ULTRA_FLYBALL_TEAM; the local `test` DB keeps TEST_TEAM. Override with KEEP_CLUBS=A,B or the keepClubs option.
const DEFAULT_KEEP_CLUBS = (process.env.KEEP_CLUBS || "ULTRA_FLYBALL_TEAM").split(",").map((s) => s.trim()).filter(Boolean);

const lineupKeyFor = (dogs) => {
  const names = (dogs || []).map((dog) => dog.name || "");

  return names.some(Boolean) ? names.join("|") : "";
};

// Server-side equivalent of lineupKeyFor - joins dog names with "|" (keeping empty slots), blank when every name is empty.
const LINEUP_KEY_EXPR = {
  $let: {
    vars: { names: { $map: { input: { $ifNull: ["$dogs", []] }, as: "d", in: { $ifNull: ["$$d.name", ""] } } } },
    in: {
      $cond: [
        { $gt: [{ $size: { $filter: { input: "$$names", as: "n", cond: { $ne: ["$$n", ""] } } } }, 0] },
        {
          $reduce: {
            input: "$$names",
            initialValue: null,
            in: { $cond: [{ $eq: ["$$value", null] }, "$$this", { $concat: ["$$value", "|", "$$this"] }] },
          },
        },
        "",
      ],
    },
  },
};

// db: a native `mongodb` Db handle. Returns a report of what it did (or would do, when dryRun).
const migrateEjsToGlobalPool = async (db, { dryRun = true, log = () => {}, keepClubs = DEFAULT_KEEP_CLUBS } = {}) => {
  const KEEP_CLUBS = keepClubs;

  const entries = db.collection("competitionentries");
  const events = db.collection("events");
  const mappings = db.collection("ejsteammappings");

  log(dryRun ? "DRY RUN - no writes" : "APPLYING");

  // 1a. Drop every row for a club we're not keeping.
  const dropClubFilter = { team: { $nin: [...KEEP_CLUBS, EJS_TEAM] } };
  const droppedOtherClubs = await entries.countDocuments(dropClubFilter);

  if (!dryRun && droppedOtherClubs) await entries.deleteMany(dropClubFilter);

  // 1b. Orphans among the kept clubs: rows whose event no longer exists.
  const keptFilter = { team: { $in: KEEP_CLUBS } };
  const referencedIds = await entries.distinct("eventId", keptFilter);
  const liveIds = new Set(
    (await events.find({ _id: { $in: referencedIds } }).project({ _id: 1 }).toArray()).map((doc) => String(doc._id))
  );
  const orphanIds = referencedIds.filter((id) => !liveIds.has(String(id)));
  const droppedOrphans = orphanIds.length
    ? await entries.countDocuments({ ...keptFilter, eventId: { $in: orphanIds } })
    : 0;

  if (!dryRun && orphanIds.length) await entries.deleteMany({ ...keptFilter, eventId: { $in: orphanIds } });

  const survivorFilter = { ...keptFilter, ...(orphanIds.length ? { eventId: { $nin: orphanIds } } : {}) };

  // 2. Club ownership - captured before ourTeam is flattened.
  const owned = await entries
    .aggregate([
      { $match: { ...survivorFilter, ourTeam: true } },
      { $group: { _id: { club: "$team", ejsTeamName: "$teamName" } } },
    ])
    .toArray();
  const ownedPairs = owned.map(({ _id }) => ({ club: _id.club, ejsTeamName: _id.ejsTeamName }));

  let mappingsCreated = 0;

  if (!dryRun) {
    for (const { club, ejsTeamName } of ownedPairs) {
      if (!ejsTeamName || !club) continue;

      const now = new Date();
      const result = await mappings.updateOne(
        { ejsTeamName },
        { $setOnInsert: { ejsTeamName, club, createdAt: now, updatedAt: now } },
        { upsert: true }
      );

      if (result.upsertedCount) mappingsCreated += 1;
    }
  }

  // 3 + 4. One pass over every survivor: (re)compute lineupKey server-side and move it into the shared pool.
  const missingKeyFilter = { ...survivorFilter, $or: [{ lineupKey: { $exists: false } }, { lineupKey: null }] };
  const lineupKeyBackfilled = await entries.countDocuments(missingKeyFilter);
  const moved = await entries.countDocuments(survivorFilter);

  if (!dryRun) {
    await entries.updateMany(survivorFilter, [
      { $set: { lineupKey: LINEUP_KEY_EXPR, team: EJS_TEAM, ourTeam: false } },
    ]);
  }

  const report = { dryRun, droppedOtherClubs, droppedOrphans, orphanIds: orphanIds.map(String), ownedPairs, mappingsCreated, lineupKeyBackfilled, moved };

  log(JSON.stringify(report, null, 2));

  return report;
};

// Run AFTER migrateEjsToGlobalPool (needs entries already flipped to team=EJS_TEAM). EJS data must never attach to
// a real club's own Event - only to one owned by the EJS sentinel. Any eventId an EJS row points at that ISN'T
// EJS_TEAM's own (legacy: imported before this pool model existed, so it landed on the importing club's own event)
// gets a fresh EJS_TEAM twin (same name/date/endDate) created, and every row for it repointed onto that twin's id.
// The original event is left completely untouched - it's still that club's own calendar record, just with no EJS
// rows pointing at it afterward.
const repointLegacyEjsEvents = async (db, { dryRun = true, log = () => {} } = {}) => {
  const entries = db.collection("competitionentries");
  const events = db.collection("events");

  const eventIds = await entries.distinct("eventId", { team: EJS_TEAM });
  const eventDocs = await events.find({ _id: { $in: eventIds } }).toArray();
  const legacy = eventDocs.filter((event) => event.team !== EJS_TEAM);

  log(dryRun ? "DRY RUN - no writes" : "APPLYING");
  log(`${legacy.length} legacy event(s) whose EJS rows point at a real club's own event`);

  const repointed = [];

  for (const event of legacy) {
    const rowCount = await entries.countDocuments({ eventId: event._id, team: EJS_TEAM });

    log(`  "${event.name}" (currently ${event.team}, ${rowCount} rows)`);

    if (dryRun) continue;

    const now = new Date();
    const { insertedId } = await events.insertOne({
      name: event.name,
      date: event.date,
      endDate: event.endDate,
      type: "COMPETITION",
      team: EJS_TEAM,
      createdAt: now,
      updatedAt: now,
    });

    await entries.updateMany({ eventId: event._id, team: EJS_TEAM }, { $set: { eventId: insertedId } });

    repointed.push({ from: String(event._id), to: String(insertedId), name: event.name, rowCount });
  }

  const report = { dryRun, legacyCount: legacy.length, repointed };

  log(JSON.stringify(report, null, 2));

  return report;
};

module.exports = { migrateEjsToGlobalPool, repointLegacyEjsEvents, lineupKeyFor, EJS_TEAM, DEFAULT_KEEP_CLUBS };
