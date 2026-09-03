const TeamModel = require("../models/teamModel");
const CrossPassModel = require("../models/crossPassModel");

// Mongoose (sub)documents need .toObject() to strip internal fields before
// going into a bulkWrite update payload; plain fixtures in tests don't have
// (or need) it. Keeps the pure logic below testable with plain objects.
const toPlain = (value) => (typeof value?.toObject === "function" ? value.toObject() : value);

// Two cross-pass entries have "the same predecessor" if they're both
// "running on lights", or both running on the same dog.
const getRunningOnKey = (crossPass) =>
  crossPass.runningOnLights ? "LIGHTS" : crossPass.runningOnDog?._id?.toString();

// Diffs a team's incoming `matchups` payload against what's currently
// stored to find lineup cross-pass entries that are new or changed, scoped
// to dogs that have either sync flag on (checked via the lineup's own
// embedded dog copy, since it mirrors the canonical Dog document). Carries
// the full predecessor snapshot (runningOnLights/runningOnDog) along too,
// so a lineup->My Dogs sync can create a standalone entry from scratch.
const findChangedSyncedCrossPasses = (existingTeam, newMatchups) => {
  const oldIndex = new Map();

  for (const lineup of existingTeam.matchups) {
    for (const crossPass of lineup.crossPasses) {
      oldIndex.set(crossPass._id.toString(), crossPass);
    }
  }

  const changed = [];

  for (const lineup of newMatchups ?? []) {
    for (const crossPass of lineup.crossPasses ?? []) {
      const id = crossPass._id?.toString();
      const old = id ? oldIndex.get(id) : undefined;

      const isDifferent =
        !old ||
        old.note !== crossPass.note ||
        old.startingPosition !== crossPass.startingPosition ||
        old.time !== crossPass.time;

      if (!isDifferent) continue;

      const dog = (lineup.dogs ?? []).find(
        (lineupDog) => lineupDog._id?.toString() === crossPass.dogId?.toString()
      );

      if (!dog?.syncCrossPasses && !dog?.syncCrossPassesWithMyDogs) continue;

      changed.push({
        dogId: crossPass.dogId?.toString(),
        runningOnKey: getRunningOnKey(crossPass),
        runningOnLights: !!crossPass.runningOnLights,
        runningOnDog: crossPass.runningOnDog,
        note: crossPass.note,
        startingPosition: crossPass.startingPosition,
        time: crossPass.time,
        syncLineups: !!dog.syncCrossPasses,
        syncMyDogs: !!dog.syncCrossPassesWithMyDogs,
      });
    }
  }

  return changed;
};

// Pure: given a club's team documents and entries to apply, returns the
// bulkWrite ops needed (and whether anything actually changed) - no DB
// access, so this is unit-testable with plain object fixtures.
const applyCrossPassSyncToTeams = (teams, entries) => {
  let anyChanged = false;

  const teamUpdates = teams
    .map((team) => {
      let teamChanged = false;

      const matchups = team.matchups.map((lineup) => ({
        ...toPlain(lineup),
        crossPasses: lineup.crossPasses.map((crossPass) => {
          const match = entries.find(
            (entry) =>
              entry.dogId === crossPass.dogId.toString() &&
              entry.runningOnKey === getRunningOnKey(crossPass)
          );

          if (
            !match ||
            (match.note === crossPass.note &&
              match.startingPosition === crossPass.startingPosition &&
              match.time === crossPass.time)
          ) {
            return toPlain(crossPass);
          }

          teamChanged = true;

          return {
            ...toPlain(crossPass),
            note: match.note,
            startingPosition: match.startingPosition,
            time: match.time,
          };
        }),
      }));

      if (!teamChanged) return null;

      anyChanged = true;

      return { updateOne: { filter: { _id: team._id }, update: { matchups } } };
    })
    .filter(Boolean);

  return { teamUpdates, anyChanged };
};

// Applies each entry's note/startingPosition/time to every other lineup
// cross-pass (in any team in the club) sharing the same dog + same
// predecessor - "same predecessor -> same timing", never touching the
// pairing itself (dogId/runningOnDog/runningOnLights stay as they are).
// Used both for lineup<->lineup sync and as the standalone->lineup half of
// the My Dogs bridge (a single-entry array works just as well as a batch).
const syncCrossPassTiming = async (club, entries) => {
  if (!entries.length) return false;

  const clubTeams = await TeamModel.find({ team: club });
  const { teamUpdates, anyChanged } = applyCrossPassSyncToTeams(clubTeams, entries);

  if (teamUpdates.length) await TeamModel.bulkWrite(teamUpdates);

  return anyChanged;
};

// Pure: builds the CrossPass bulkWrite upsert ops for the lineup -> My Dogs
// half of the bridge (see syncCrossPassesToMyDogs) - no DB access.
const buildMyDogsSyncOps = (club, entries) =>
  entries
    .filter((entry) => entry.syncMyDogs)
    .map((entry) => ({
      updateOne: {
        filter: entry.runningOnLights
          ? { team: club, dogId: entry.dogId, runningOnLights: true }
          : { team: club, dogId: entry.dogId, "runningOnDog._id": entry.runningOnKey },
        update: {
          $set: {
            team: club,
            dogId: entry.dogId,
            runningOnLights: entry.runningOnLights,
            runningOnDog: entry.runningOnLights ? undefined : entry.runningOnDog,
            note: entry.note,
            startingPosition: entry.startingPosition,
            time: entry.time,
          },
        },
        upsert: true,
      },
    }));

// Lineup -> My Dogs half of the bridge: upserts a matching standalone
// CrossPass (same dogId + predecessor) for every entry whose dog has
// syncCrossPassesWithMyDogs on, creating one from scratch if it doesn't
// exist yet (unlike lineup slots, the My Dogs list is free-form).
const syncCrossPassesToMyDogs = async (club, entries) => {
  const bulkOps = buildMyDogsSyncOps(club, entries);

  if (!bulkOps.length) return false;

  await CrossPassModel.bulkWrite(bulkOps);

  return true;
};

// My Dogs -> lineup half of the bridge: reuses syncCrossPassTiming to push
// a single standalone cross-pass's timing into every matching lineup entry
// (update only - a lineup's cross-pass "slots" are fixed by its dog running
// order, so unlike the other direction there's nothing valid to create).
const syncCrossPassFromMyDogs = async (club, crossPass) =>
  syncCrossPassTiming(club, [
    {
      dogId: crossPass.dogId?.toString(),
      runningOnKey: getRunningOnKey(crossPass),
      note: crossPass.note,
      startingPosition: crossPass.startingPosition,
      time: crossPass.time,
    },
  ]);

module.exports = {
  getRunningOnKey,
  findChangedSyncedCrossPasses,
  applyCrossPassSyncToTeams,
  buildMyDogsSyncOps,
  syncCrossPassTiming,
  syncCrossPassesToMyDogs,
  syncCrossPassFromMyDogs,
};
