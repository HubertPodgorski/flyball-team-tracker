const UserModel = require("../models/userModel");
const DogModel = require("../models/dogModel");
const DogTaskModel = require("../models/dogTaskModel");
const EventModel = require("../models/eventModel");
const EventTemplateModel = require("../models/eventTemplateModel");
const SquadModel = require("../models/squadModel");
const { TEAMS } = require("../helpers/teams");

const entityConfig = {
  users: { Model: UserModel, updatedEvent: "users_updated" },
  dogs: { Model: DogModel, updatedEvent: "dogs_updated" },
  "dog-tasks": { Model: DogTaskModel, updatedEvent: "dog_tasks_updated" },
  events: { Model: EventModel, updatedEvent: "events_updated" },
  "event-templates": {
    Model: EventTemplateModel,
    updatedEvent: "event_templates_updated",
  },
  squads: { Model: SquadModel, updatedEvent: "squads_updated" },
};

// Same exclusion as userController's getAllUsers.
const withoutSuperAdmins = (entity, filter) =>
  entity === "users" ? { ...filter, roles: { $nin: ["SUPER_ADMIN"] } } : filter;

const broadcastTeam = async (io, entity, team) => {
  const { Model, updatedEvent } = entityConfig[entity];

  const items = await Model.find(withoutSuperAdmins(entity, { team })).sort({
    createdAt: -1,
  });

  io.to(team).emit(updatedEvent, items);
};

const getList = (entity) => async (req, res) => {
  const { Model } = entityConfig[entity];
  const { team } = req.query;

  if (team && !TEAMS.includes(team)) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }

  const filter = withoutSuperAdmins(entity, team ? { team } : {});

  const items = await Model.find(filter).sort({ createdAt: -1 });

  res.status(200).json(items);
};

const createItem = (entity, io) => async (req, res) => {
  const { Model } = entityConfig[entity];
  const { team, ...data } = req.body;

  if (!team || !TEAMS.includes(team)) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }

  const created = await Model.create({ ...data, team });

  await broadcastTeam(io, entity, team);

  res.status(200).json(created);
};

const updateItem = (entity, io) => async (req, res) => {
  const { Model } = entityConfig[entity];
  const { _id, team, ...data } = req.body;

  if (!team || !TEAMS.includes(team)) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }

  const existing = await Model.findById(_id);

  if (!existing) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  const previousTeam = existing.team;

  const updated = await Model.findOneAndUpdate(
    { _id },
    { ...data, team },
    { returnDocument: "after" }
  );

  await broadcastTeam(io, entity, team);

  // Row moved teams - refresh the old team's clients too.
  if (previousTeam && previousTeam !== team) {
    await broadcastTeam(io, entity, previousTeam);
  }

  res.status(200).json(updated);
};

const deleteItem = (entity, io) => async (req, res) => {
  const { Model } = entityConfig[entity];
  const { _id } = req.params;
  const { team } = req.query;

  if (!team || !TEAMS.includes(team)) {
    return res.status(400).json({ error: "INVALID_TEAM" });
  }

  await Model.findOneAndDelete({ _id });

  await broadcastTeam(io, entity, team);

  res.status(200).json({ ok: true });
};

module.exports = { entityConfig, getList, createItem, updateItem, deleteItem };
