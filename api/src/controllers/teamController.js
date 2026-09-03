const TeamModel = require("../models/teamModel");
const TaskModel = require("../models/taskModel");
const { broadcast } = require("../sse");
const { detachTasksFromMatchup, keepOnlyPoolDogsInMatchups } = require("../helpers/lineupCascade");
const {
  findChangedSyncedCrossPasses,
  syncCrossPassTiming,
  syncCrossPassesToMyDogs,
} = require("../helpers/crossPassSync");

const findClubTeams = (club) =>
  TeamModel.find({ team: club }).sort({ createdAt: -1 });

const findClubTasks = (club) =>
  TaskModel.find({ team: club }).sort({ createdAt: -1 });

const getTeams = async (req, res) => {
  const teams = await findClubTeams(req.club);

  res.status(200).json(teams);
};

const createTeam = async (req, res) => {
  const team = await TeamModel.create({ ...req.body, team: req.club });

  res.status(200).json(team);
  broadcast(req.club, "teams_updated", await findClubTeams(req.club));
};

// Scoped by club, not just _id, to block cross-club edits.
const updateTeam = async (req, res) => {
  const { _id, ...data } = req.body;

  const existingTeam = await TeamModel.findOne({ _id, team: req.club });

  if (!existingTeam) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  // Every caller sends the team's full (possibly trimmed) matchups array -
  // diff against what's currently stored to find lineups that just got
  // removed, so tasks linked to them can be detached below.
  const newMatchupIds = new Set(
    (data.matchups ?? []).map((matchup) => matchup._id?.toString()).filter(Boolean)
  );

  const removedLineups = data.matchups
    ? existingTeam.matchups.filter(
        (lineup) => !newMatchupIds.has(lineup._id.toString())
      )
    : [];

  // Every lineup may only reference dogs still in this team's pool - kept
  // as an invariant of the payload itself (not a diff against server state)
  // so two overlapping saves can't resurrect a dog one of them removed.
  if (data.dogs && data.matchups) {
    const allowedDogIds = new Set(
      data.dogs.map((dog) => dog._id?.toString()).filter(Boolean)
    );

    data.matchups = keepOnlyPoolDogsInMatchups(data.matchups, allowedDogIds);
  }

  // Diffed against the pre-update state, so this only fires for entries
  // that actually changed in this request - not on every save.
  const changedSyncedCrossPasses = findChangedSyncedCrossPasses(
    existingTeam,
    data.matchups
  );

  const team = await TeamModel.findOneAndUpdate(
    { _id, team: req.club },
    { ...data, team: req.club },
    { returnDocument: "after" }
  );

  if (!team) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  let tasksChanged = false;

  for (const lineup of removedLineups) {
    const changed = await detachTasksFromMatchup(
      req.club,
      existingTeam._id,
      lineup._id,
      lineup.dogs
    );

    tasksChanged = tasksChanged || changed;
  }

  // Propagate synced-dog cross-pass timing to every other lineup (any team
  // in the club) sharing the same dog + predecessor, and/or to the dog's
  // standalone My Dogs cross-passes - two independent opt-in flags.
  await syncCrossPassTiming(
    req.club,
    changedSyncedCrossPasses.filter((entry) => entry.syncLineups)
  );
  await syncCrossPassesToMyDogs(req.club, changedSyncedCrossPasses);

  res.status(200).json(team);
  broadcast(req.club, "teams_updated", await findClubTeams(req.club));

  if (tasksChanged) {
    broadcast(req.club, "tasks_updated", await findClubTasks(req.club));
  }
};

const deleteTeam = async (req, res) => {
  const { id } = req.params;

  const team = await TeamModel.findOneAndDelete({ _id: id, team: req.club });

  let tasksChanged = false;

  if (team) {
    for (const lineup of team.matchups) {
      const changed = await detachTasksFromMatchup(
        req.club,
        team._id,
        lineup._id,
        lineup.dogs
      );

      tasksChanged = tasksChanged || changed;
    }
  }

  res.status(200).json({ ok: true });
  broadcast(req.club, "teams_updated", await findClubTeams(req.club));

  if (tasksChanged) {
    broadcast(req.club, "tasks_updated", await findClubTasks(req.club));
  }
};

module.exports = { getTeams, createTeam, updateTeam, deleteTeam };
