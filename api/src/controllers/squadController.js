const SquadModel = require("../models/squadModel");
const { broadcast } = require("../sse");

const findTeamSquads = (team) =>
  SquadModel.find({ team }).sort({ createdAt: -1 });

const getSquads = async (req, res) => {
  const squads = await findTeamSquads(req.team);

  res.status(200).json(squads);
};

const createSquad = async (req, res) => {
  const squad = await SquadModel.create({ ...req.body, team: req.team });

  res.status(200).json(squad);
  broadcast(req.team, "squads_updated", await findTeamSquads(req.team));
};

// Scoped by team, not just _id, to block cross-team edits.
const updateSquad = async (req, res) => {
  const { _id, ...data } = req.body;

  const squad = await SquadModel.findOneAndUpdate(
    { _id, team: req.team },
    { ...data, team: req.team },
    { returnDocument: "after" }
  );

  if (!squad) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  res.status(200).json(squad);
  broadcast(req.team, "squads_updated", await findTeamSquads(req.team));
};

const deleteSquad = async (req, res) => {
  const { id } = req.params;

  await SquadModel.findOneAndDelete({ _id: id, team: req.team });

  res.status(200).json({ ok: true });
  broadcast(req.team, "squads_updated", await findTeamSquads(req.team));
};

module.exports = { getSquads, createSquad, updateSquad, deleteSquad };
