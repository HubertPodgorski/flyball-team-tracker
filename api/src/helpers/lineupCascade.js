const TaskModel = require("../models/taskModel");

// A task linked to a lineup (matchupRef) keeps working standalone once that
// lineup disappears - detach it by clearing the link and freezing the
// lineup's last-known dogs into the task's own dogs array.
const detachTasksFromMatchup = async (club, squadId, matchupId, dogs) => {
  const { modifiedCount } = await TaskModel.updateMany(
    {
      team: club,
      "matchupRef.squadId": squadId,
      "matchupRef.matchupId": matchupId,
    },
    { $unset: { matchupRef: "" }, $set: { dogs } }
  );

  return modifiedCount > 0;
};

// Pure: enforces "every lineup only references dogs still in the team's own
// pool" as an INVARIANT of the payload being saved, not a diff against
// server state - deliberately, so it self-corrects regardless of request
// ordering. Two overlapping saves (e.g. a double-click before the first
// request's response arrives and updates the UI) would otherwise each
// diff against a DB snapshot that's already out of date by the time they
// land, and the "loser" could silently resurrect a dog into a lineup that
// the "winner" had already removed it from. Keying off the payload's own
// `dogs` list instead means every save is independently correct no matter
// which one lands last. Any cross-pass entry for a disallowed dog goes with
// it (deleted if it owned the leg, cleared if it was the predecessor) -
// otherwise it could resurrect with stale timing if the dog is re-added.
// No DB access, so unit-testable directly.
const keepOnlyPoolDogsInMatchups = (matchups, allowedDogIds) =>
  (matchups ?? []).map((lineup) => ({
    ...lineup,
    dogs: (lineup.dogs ?? []).filter((dog) => allowedDogIds.has(dog._id?.toString())),
    crossPasses: (lineup.crossPasses ?? [])
      .filter((crossPass) => allowedDogIds.has(crossPass.dogId?.toString()))
      .map((crossPass) => {
        const predecessorId = crossPass.runningOnDog?._id?.toString();

        if (!predecessorId || allowedDogIds.has(predecessorId)) return crossPass;

        const { runningOnDog, ...rest } = crossPass;

        return rest;
      }),
  }));

module.exports = { detachTasksFromMatchup, keepOnlyPoolDogsInMatchups };
