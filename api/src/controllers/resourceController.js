const ResourceModel = require("../models/resourceModel");
const { broadcast } = require("../sse");

const findClubResources = (club) =>
  ResourceModel.find({ team: club }).sort({ createdAt: -1 });

const getResources = async (req, res) => {
  const resources = await findClubResources(req.club);

  res.status(200).json(resources);
};

const createResource = async (req, res) => {
  const resource = await ResourceModel.create({ ...req.body, team: req.club });

  res.status(200).json(resource);
  broadcast(req.club, "resources_updated", await findClubResources(req.club));
};

const updateResource = async (req, res) => {
  const { _id, ...data } = req.body;

  const resource = await ResourceModel.findOneAndUpdate(
    { _id, team: req.club },
    { ...data, team: req.club },
    { returnDocument: "after" }
  );

  if (!resource) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  res.status(200).json(resource);
  broadcast(req.club, "resources_updated", await findClubResources(req.club));
};

const deleteResource = async (req, res) => {
  const { id } = req.params;

  await ResourceModel.findOneAndDelete({ _id: id, team: req.club });

  res.status(200).json({ ok: true });
  broadcast(req.club, "resources_updated", await findClubResources(req.club));
};

module.exports = { getResources, createResource, updateResource, deleteResource };
