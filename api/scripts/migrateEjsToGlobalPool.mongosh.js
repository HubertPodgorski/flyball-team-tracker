// PRODUCTION migration. Run only AFTER the new EJS backend + frontend are deployed.
// MongoDB Compass -> ">_MONGOSH" tab, select the prod "flyball-team-tracker" DB. Run the whole block.
// DRY_RUN = true only reads; flip to false to apply. Idempotent - safe to re-run.
// Expected dry-run: drop 2686 (other clubs) + 810 (orphan KOZERKI dup), 3 mappings -> ULTRA_FLYBALL_TEAM, move 3074.
// (Local `test` DB rehearsal used KEEP_CLUBS = ["TEST_TEAM"] instead.)

// Wrapped in a block so pasting it again in the same shell session doesn't throw "already declared".
{
const DRY_RUN = true;
const KEEP_CLUBS = ["ULTRA_FLYBALL_TEAM"]; // prod; use ["TEST_TEAM"] to rehearse on the `test` DB
const EJS_TEAM = "__EJS__";

const ce = db.competitionentries;

// Server-side join of dog names with "|" (empty slots kept), blank when every name is empty - matches the app's lineupKeyFor.
const LINEUP_KEY_EXPR = {
  $let: {
    vars: { names: { $map: { input: { $ifNull: ["$dogs", []] }, as: "d", in: { $ifNull: ["$$d.name", ""] } } } },
    in: {
      $cond: [
        { $gt: [{ $size: { $filter: { input: "$$names", as: "n", cond: { $ne: ["$$n", ""] } } } }, 0] },
        { $reduce: { input: "$$names", initialValue: null,
          in: { $cond: [{ $eq: ["$$value", null] }, "$$this", { $concat: ["$$value", "|", "$$this"] }] } } },
        "",
      ],
    },
  },
};

print(DRY_RUN ? "DRY RUN - no writes\n" : "APPLYING\n");

// 1a. Drop every row for a club we're not keeping.
const dropClubFilter = { team: { $nin: [...KEEP_CLUBS, EJS_TEAM] } };
print("entries to drop (other clubs): " + ce.countDocuments(dropClubFilter));
if (!DRY_RUN) ce.deleteMany(dropClubFilter);

// 1b. Orphans among the kept clubs: rows whose event no longer exists.
const keptFilter = { team: { $in: KEEP_CLUBS } };
const referencedIds = ce.distinct("eventId", keptFilter);
const liveIds = new Set(
  db.events.find({ _id: { $in: referencedIds } }, { _id: 1 }).toArray().map((d) => d._id.toString())
);
const orphanIds = referencedIds.filter((id) => !liveIds.has(id.toString()));
print("entries to drop (event gone): " + ce.countDocuments({ ...keptFilter, eventId: { $in: orphanIds } }) +
  "  " + JSON.stringify(orphanIds.map((id) => id.toString())));
if (!DRY_RUN && orphanIds.length) ce.deleteMany({ ...keptFilter, eventId: { $in: orphanIds } });

const survivorFilter = { ...keptFilter, ...(orphanIds.length ? { eventId: { $nin: orphanIds } } : {}) };

// 2. Club ownership - captured before ourTeam is flattened.
const owned = ce.aggregate([
  { $match: { ...survivorFilter, ourTeam: true } },
  { $group: { _id: { club: "$team", ejsTeamName: "$teamName" } } },
]).toArray();
print("\nteam mappings to create:");
owned.forEach(({ _id }) => print('  "' + _id.ejsTeamName + '" -> ' + _id.club));
if (!DRY_RUN) {
  owned.forEach(({ _id }) => {
    if (!_id.ejsTeamName || !_id.club) return;
    const now = new Date();
    db.ejsteammappings.updateOne(
      { ejsTeamName: _id.ejsTeamName },
      { $setOnInsert: { ejsTeamName: _id.ejsTeamName, club: _id.club, createdAt: now, updatedAt: now } },
      { upsert: true }
    );
  });
}

// 3 + 4. One bulk pass over every survivor: (re)compute lineupKey server-side and move it into the shared pool.
print("\nlineupKey to backfill: " +
  ce.countDocuments({ ...survivorFilter, $or: [{ lineupKey: { $exists: false } }, { lineupKey: null }] }));
print("entries to move into the __EJS__ pool: " + ce.countDocuments(survivorFilter));
if (!DRY_RUN) {
  ce.updateMany(survivorFilter, [{ $set: { lineupKey: LINEUP_KEY_EXPR, team: EJS_TEAM, ourTeam: false } }]);
}

print(DRY_RUN ? "\nDRY RUN complete - set DRY_RUN = false and re-run to apply." : "\nDONE.");
}
