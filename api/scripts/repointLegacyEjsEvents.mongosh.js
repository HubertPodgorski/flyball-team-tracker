// PRODUCTION migration. Run AFTER migrateEjsToGlobalPool.mongosh.js (needs entries already flipped to team=__EJS__).
// MongoDB Compass -> ">_MONGOSH" tab, select the target DB. Run the whole block.
// DRY_RUN = true only reads; flip to false to apply. Idempotent - safe to re-run.
// Repoints any EJS row still pointing at a real club's own Event (legacy, from before the pool model existed) onto
// a fresh __EJS__ twin event (same name/date/endDate). The club's original event is left completely untouched.

// Wrapped in a block so pasting it again in the same shell session doesn't throw "already declared".
{
const DRY_RUN = true;
const EJS_TEAM = "__EJS__";

const ce = db.competitionentries;
const ev = db.events;

print(DRY_RUN ? "DRY RUN - no writes\n" : "APPLYING\n");

const eventIds = ce.distinct("eventId", { team: EJS_TEAM });
const eventDocs = ev.find({ _id: { $in: eventIds } }).toArray();
const legacy = eventDocs.filter((event) => event.team !== EJS_TEAM);

print(legacy.length + " legacy event(s) whose EJS rows point at a real club's own event");

legacy.forEach((event) => {
  const rowCount = ce.countDocuments({ eventId: event._id, team: EJS_TEAM });

  print('  "' + event.name + '" (currently ' + event.team + ", " + rowCount + " rows)");

  if (DRY_RUN) return;

  const now = new Date();
  const { insertedId } = ev.insertOne({
    name: event.name,
    date: event.date,
    endDate: event.endDate,
    type: "COMPETITION",
    team: EJS_TEAM,
    createdAt: now,
    updatedAt: now,
  });

  ce.updateMany({ eventId: event._id, team: EJS_TEAM }, { $set: { eventId: insertedId } });

  print("    -> repointed onto new event " + insertedId.toString());
});

print(DRY_RUN ? "\nDRY RUN complete - set DRY_RUN = false and re-run to apply." : "\nDONE.");
}
