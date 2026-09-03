const CrossPassModel = require("../models/crossPassModel");
const DogModel = require("../models/dogModel");
const TeamModel = require("../models/teamModel");
const { broadcast } = require("../sse");
const { syncCrossPassFromMyDogs } = require("../helpers/crossPassSync");

const findClubCrossPasses = (club) =>
  CrossPassModel.find({ team: club }).sort({ createdAt: -1 });

const getCrossPasses = async (req, res) => {
  const crossPasses = await findClubCrossPasses(req.club);

  res.status(200).json(crossPasses);
};

// My Dogs -> lineup half of the bridge (see crossPassSync.js) - only fires
// when the owning dog has syncCrossPassesWithMyDogs on.
const syncToLineupsIfEnabled = async (club, crossPass) => {
  const dog = await DogModel.findById(crossPass.dogId);

  if (!dog?.syncCrossPassesWithMyDogs) return false;

  return syncCrossPassFromMyDogs(club, crossPass);
};

const createCrossPass = async (req, res) => {
  const crossPass = await CrossPassModel.create({ ...req.body, team: req.club });

  res.status(200).json(crossPass);
  broadcast(req.club, "cross_passes_updated", await findClubCrossPasses(req.club));

  if (await syncToLineupsIfEnabled(req.club, crossPass)) {
    broadcast(
      req.club,
      "teams_updated",
      await TeamModel.find({ team: req.club }).sort({ createdAt: -1 })
    );
  }
};

const updateCrossPass = async (req, res) => {
  const { _id, ...data } = req.body;

  const crossPass = await CrossPassModel.findOneAndUpdate(
    { _id, team: req.club },
    { ...data, team: req.club },
    { returnDocument: "after" }
  );

  if (!crossPass) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  res.status(200).json(crossPass);
  broadcast(req.club, "cross_passes_updated", await findClubCrossPasses(req.club));

  if (await syncToLineupsIfEnabled(req.club, crossPass)) {
    broadcast(
      req.club,
      "teams_updated",
      await TeamModel.find({ team: req.club }).sort({ createdAt: -1 })
    );
  }
};

const deleteCrossPass = async (req, res) => {
  const { id } = req.params;

  await CrossPassModel.findOneAndDelete({ _id: id, team: req.club });

  res.status(200).json({ ok: true });
  broadcast(req.club, "cross_passes_updated", await findClubCrossPasses(req.club));
};

module.exports = { getCrossPasses, createCrossPass, updateCrossPass, deleteCrossPass };
