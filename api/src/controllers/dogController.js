const DogModel = require("../models/dogModel");
const { broadcast } = require("../sse");
const { replaceDogEverywhere, broadcastDogCascade } = require("../helpers/dogCascade");

const findClubDogs = (club) =>
  DogModel.find({ team: club }).sort({ createdAt: -1 });

const getDogs = async (req, res) => {
  const dogs = await findClubDogs(req.club);

  res.status(200).json(dogs);
};

const createDog = async (req, res) => {
  const dog = await DogModel.create({ ...req.body, team: req.club });

  res.status(200).json(dog);
  broadcast(req.club, "dogs_updated", await findClubDogs(req.club));
};

const updateDog = async (req, res) => {
  const { _id, ...data } = req.body;

  const dog = await DogModel.findOneAndUpdate(
    { _id, team: req.club },
    { ...data, team: req.club },
    { returnDocument: "after" }
  );

  if (!dog) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  const cascade = await replaceDogEverywhere(req.club, _id, dog);

  res.status(200).json(dog);
  broadcast(req.club, "dogs_updated", await findClubDogs(req.club));

  await broadcastDogCascade(req.club, cascade);
};

// Cascades the removal everywhere the dog is embedded - otherwise every
// Task/Team/User/CrossPass that referenced it keeps a dangling copy forever.
const deleteDog = async (req, res) => {
  const { id } = req.params;

  await DogModel.findOneAndDelete({ _id: id, team: req.club });

  const cascade = await replaceDogEverywhere(req.club, id, null);

  res.status(200).json({ ok: true });
  broadcast(req.club, "dogs_updated", await findClubDogs(req.club));

  await broadcastDogCascade(req.club, cascade);
};

module.exports = { getDogs, createDog, updateDog, deleteDog };
