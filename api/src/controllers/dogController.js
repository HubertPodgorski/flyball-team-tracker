const DogModel = require("../models/dogModel");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const TaskModel = require("../models/taskModel");

// get all dogs
const getAllDogs = async (callback, userToken) => {
  const { team } = jwt.decode(userToken);

  const dogs = await DogModel.find({ team }).sort({ createdAt: -1 });

  callback(dogs);
};

// get single dog
const getDogById = async (received, callback) => {
  const { _id } = received;

  // if (!mongoose.Types.ObjectId.isValid(_id)) {
  //   return res.status(404).json({ error: "DOG_NOT_FOUND" });
  // }

  const dog = await DogModel.findById(_id);

  callback(dog);
};

// create new dog
const createDog = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { name } = received;

  const dog = await DogModel.create({ name, team });

  const allDogs = await DogModel.find({ team });

  callback("create_dog", dog);

  io.to(team).emit("dogs_updated", allDogs);
};

// delete dog
const deleteDogById = async (received, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { _id } = received;

  // TODO: WS handler for dog not found
  // if (!mongoose.Types.ObjectId.isValid(_id)) {
  //   return res.status(404).json({ error: "DOG_NOT_FOUND" });
  // }

  await DogModel.findOneAndDelete({ _id });

  // TODO: WS handler for dog not found

  const allDogs = await DogModel.find({ team });

  io.to(team).emit("dogs_updated", allDogs);
};

// update dog
const updateDogById = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { _id } = received;

  // TODO: WS handler for dog not found
  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "DOG_NOT_FOUND" });
  // }

  const dog = await DogModel.findOneAndUpdate(
    { _id: _id },
    { ...received, team },
    {
      new: true,
    }
  );

  // TODO: WS handler for dog not found
  // if (!dog) {
  //   return res.status(404).json({ error: "DOG_NOT_FOUND" });
  // }

  const allTasks = await TaskModel.find({ team });

  // {_id, dogs: [...DogModel]}
  const tasksToUpdate = allTasks.reduce((taskToUpdateList, task) => {
    const hasUpdatedDog = task.dogs.some((dog) => dog._id.toString() === _id);

    if (!hasUpdatedDog) {
      return taskToUpdateList;
    }

    const newDogList = task.dogs.map((_dog) => {
      if (_dog._id.toString() === _id) {
        return dog;
      }

      return _dog;
    });

    return [
      ...taskToUpdateList,
      { _id: task._id.toString(), dogs: newDogList },
    ];
  }, []);

  for (const taskToUpdate of tasksToUpdate) {
    const updatedTask = await TaskModel.findOneAndUpdate(
      { _id: taskToUpdate._id },
      { $set: { dogs: taskToUpdate.dogs } },
      {
        new: true,
      }
    );
  }

  const allDogs = await DogModel.find({ team });

  callback(dog);
  io.to(team).emit("dogs_updated", allDogs);

  const updatedAllTasks = await TaskModel.find({ team });

  io.to(team).emit("tasks_updated", updatedAllTasks);
};

module.exports = {
  createDog,
  getAllDogs,
  getDogById,
  deleteDogById,
  updateDogById,
};
