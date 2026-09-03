const UserModel = require("../models/userModel");
const DogModel = require("../models/dogModel");
const DogTaskModel = require("../models/dogTaskModel");
const EventModel = require("../models/eventModel");
const TeamModel = require("../models/teamModel");
const TaskModel = require("../models/taskModel");
const { CLUBS } = require("../helpers/teams");
const { broadcast } = require("../sse");
const { detachTasksFromMatchup, keepOnlyPoolDogsInMatchups } = require("../helpers/lineupCascade");
const { replaceDogEverywhere, broadcastDogCascade } = require("../helpers/dogCascade");
const {
  findChangedSyncedCrossPasses,
  syncCrossPassTiming,
  syncCrossPassesToMyDogs,
} = require("../helpers/crossPassSync");

const entityConfig = {
  users: { Model: UserModel, updatedEvent: "users_updated" },
  dogs: { Model: DogModel, updatedEvent: "dogs_updated" },
  "dog-tasks": { Model: DogTaskModel, updatedEvent: "dog_tasks_updated" },
  events: { Model: EventModel, updatedEvent: "events_updated" },
  teams: { Model: TeamModel, updatedEvent: "teams_updated" },
};

// Same exclusion as userController's getAllUsers.
const withoutSuperAdmins = (entity, filter) =>
  entity === "users" ? { ...filter, roles: { $nin: ["SUPER_ADMIN"] } } : filter;

const broadcastClub = async (entity, club) => {
  const { Model, updatedEvent } = entityConfig[entity];

  const items = await Model.find(withoutSuperAdmins(entity, { team: club })).sort({
    createdAt: -1,
  });

  broadcast(club, updatedEvent, items);
};

const getList = (entity) => async (req, res) => {
  const { Model } = entityConfig[entity];
  const { team: club } = req.query;

  if (club && !CLUBS.includes(club)) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }

  const filter = withoutSuperAdmins(entity, club ? { team: club } : {});

  const items = await Model.find(filter).sort({ createdAt: -1 });

  res.status(200).json(items);
};

const createItem = (entity) => async (req, res) => {
  const { Model } = entityConfig[entity];
  const { team: club, ...data } = req.body;

  if (!club || !CLUBS.includes(club)) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }

  const created = await Model.create({ ...data, team: club });

  await broadcastClub(entity, club);

  res.status(200).json(created);
};

// Same lineup-detach the regular /teams route does (see teamController.js) -
// this generic entity path is teams' OTHER write path (super-admin grid),
// so it needs the same cascade or a removed lineup here re-orphans tasks.
const detachRemovedLineups = async (existingTeam, newMatchups) => {
  const newMatchupIds = new Set(
    (newMatchups ?? []).map((matchup) => matchup._id?.toString()).filter(Boolean)
  );

  const removedLineups = newMatchups
    ? existingTeam.matchups.filter(
        (lineup) => !newMatchupIds.has(lineup._id.toString())
      )
    : [];

  let tasksChanged = false;

  for (const lineup of removedLineups) {
    const changed = await detachTasksFromMatchup(
      existingTeam.team,
      existingTeam._id,
      lineup._id,
      lineup.dogs
    );

    tasksChanged = tasksChanged || changed;
  }

  return tasksChanged;
};

const updateItem = (entity) => async (req, res) => {
  const { Model } = entityConfig[entity];
  const { _id, team: club, ...data } = req.body;

  if (!club || !CLUBS.includes(club)) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }

  const existing = await Model.findById(_id);

  if (!existing) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  const previousClub = existing.team;

  const tasksChanged =
    entity === "teams" ? await detachRemovedLineups(existing, data.matchups) : false;

  // Every lineup may only reference dogs still in this team's pool - kept
  // as an invariant of the payload itself (not a diff against server state),
  // same as teamController.js's /teams route.
  if (entity === "teams" && data.dogs && data.matchups) {
    const allowedDogIds = new Set(
      data.dogs.map((dog) => dog._id?.toString()).filter(Boolean)
    );

    data.matchups = keepOnlyPoolDogsInMatchups(data.matchups, allowedDogIds);
  }

  // Diffed against the pre-update state, same as teamController.js's own
  // /teams route - this generic entity path is teams' OTHER write path.
  const changedSyncedCrossPasses =
    entity === "teams" ? findChangedSyncedCrossPasses(existing, data.matchups) : [];

  const updated = await Model.findOneAndUpdate(
    { _id },
    { ...data, team: club },
    { returnDocument: "after" }
  );

  // Same dog fan-out the regular /dogs route does (see dogCascade.js) - this
  // generic entity path is dogs' OTHER write path (super-admin grid), so it
  // needs the same cascade or an edit here (e.g. jump height) never
  // propagates to Tasks/Teams/lineups/Users/CrossPasses that embed the dog.
  const dogCascade =
    entity === "dogs" ? await replaceDogEverywhere(previousClub, _id, updated) : null;

  if (entity === "teams") {
    await syncCrossPassTiming(
      previousClub,
      changedSyncedCrossPasses.filter((entry) => entry.syncLineups)
    );
    await syncCrossPassesToMyDogs(previousClub, changedSyncedCrossPasses);
  }

  await broadcastClub(entity, club);

  // Row moved clubs - refresh the old club's clients too.
  if (previousClub && previousClub !== club) {
    await broadcastClub(entity, previousClub);
  }

  if (tasksChanged) {
    broadcast(
      previousClub,
      "tasks_updated",
      await TaskModel.find({ team: previousClub }).sort({ createdAt: -1 })
    );
  }

  if (dogCascade) {
    await broadcastDogCascade(previousClub, dogCascade);
  }

  res.status(200).json(updated);
};

const deleteItem = (entity) => async (req, res) => {
  const { Model } = entityConfig[entity];
  const { _id } = req.params;
  const { team: club } = req.query;

  if (!club || !CLUBS.includes(club)) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }

  const existing =
    entity === "teams" || entity === "dogs" ? await Model.findById(_id) : null;

  await Model.findOneAndDelete({ _id });

  const tasksChanged =
    entity === "teams" && existing ? await detachRemovedLineups(existing, []) : false;

  const dogCascade =
    entity === "dogs" && existing
      ? await replaceDogEverywhere(existing.team, _id, null)
      : null;

  await broadcastClub(entity, club);

  if (tasksChanged) {
    broadcast(
      existing.team,
      "tasks_updated",
      await TaskModel.find({ team: existing.team }).sort({ createdAt: -1 })
    );
  }

  if (dogCascade) {
    await broadcastDogCascade(existing.team, dogCascade);
  }

  res.status(200).json({ ok: true });
};

// Super-admin resets any club's member's password - unlike the trainer
// version (userController.resetUserPassword), not scoped to one club. The
// temporary password is returned once, in this response only.
const resetUserPassword = async (req, res) => {
  const { _id } = req.params;

  try {
    const { temporaryPassword } = await UserModel.resetPasswordForUser(_id);

    res.status(200).json({ temporaryPassword });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
};

module.exports = {
  entityConfig,
  getList,
  createItem,
  updateItem,
  deleteItem,
  resetUserPassword,
};
