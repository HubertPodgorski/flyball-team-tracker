const ClubSettingsModel = require("../models/clubSettingsModel");
const TaskModel = require("../models/taskModel");
const { broadcast } = require("../sse");
const { DEFAULT_FEATURES, normalizeFeatures } = require("../helpers/clubFeatures");
const { detachAllLineupLinkedTasks } = require("../helpers/lineupCascade");

const findClubTasks = (club) => TaskModel.find({ team: club }).sort({ createdAt: -1 });

const findOrCreateClubSettings = async (club) => {
  const settings = await ClubSettingsModel.findOne({ team: club });

  if (settings) return settings;

  return ClubSettingsModel.create({ team: club, features: DEFAULT_FEATURES });
};

const getClubSettings = async (req, res) => {
  const settings = await findOrCreateClubSettings(req.club);

  res.status(200).json(settings);
};

const updateClubSettings = async (req, res) => {
  const existing = await findOrCreateClubSettings(req.club);
  const wasTeamsAndLineupsOn = existing.features.teamsAndLineups;
  const features = normalizeFeatures({
    ...existing.features.toObject(),
    ...req.body.features,
  });

  const settings = await ClubSettingsModel.findOneAndUpdate(
    { team: req.club },
    { features },
    { returnDocument: "after" }
  );

  res.status(200).json(settings);
  broadcast(req.club, "club_settings_updated", settings);

  // Nothing left to link to once lineups are off - detach, keeping dogs.
  if (wasTeamsAndLineupsOn && !features.teamsAndLineups) {
    const tasksChanged = await detachAllLineupLinkedTasks(req.club);

    if (tasksChanged) broadcast(req.club, "tasks_updated", await findClubTasks(req.club));
  }
};

module.exports = { getClubSettings, updateClubSettings };
