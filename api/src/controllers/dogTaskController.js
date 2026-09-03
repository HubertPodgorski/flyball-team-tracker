const DogTaskModel = require("../models/dogTaskModel");
const { broadcast } = require("../sse");

const findClubDogTasks = (club) =>
  DogTaskModel.find({ team: club }).sort({ createdAt: -1 });

const getDogTasks = async (req, res) => {
  const dogTasks = await findClubDogTasks(req.club);

  res.status(200).json(dogTasks);
};

const createDogTask = async (req, res) => {
  const dogTask = await DogTaskModel.create({ ...req.body, team: req.club });

  res.status(200).json(dogTask);
  broadcast(req.club, "dog_tasks_updated", await findClubDogTasks(req.club));
};

const updateDogTask = async (req, res) => {
  const { _id, ...data } = req.body;

  const dogTask = await DogTaskModel.findOneAndUpdate(
    { _id, team: req.club },
    { ...data, team: req.club },
    { returnDocument: "after" }
  );

  if (!dogTask) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  res.status(200).json(dogTask);
  broadcast(req.club, "dog_tasks_updated", await findClubDogTasks(req.club));
};

const deleteDogTask = async (req, res) => {
  const { id } = req.params;

  await DogTaskModel.findOneAndDelete({ _id: id, team: req.club });

  res.status(200).json({ ok: true });
  broadcast(req.club, "dog_tasks_updated", await findClubDogTasks(req.club));
};

module.exports = { getDogTasks, createDogTask, updateDogTask, deleteDogTask };
