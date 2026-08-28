const EventModel = require("../models/eventModel");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// get all events
const getAllEvents = async (callback, userToken) => {
  const { team } = jwt.decode(userToken);

  const events = await EventModel.find({ team }).sort({ createdAt: -1 });

  callback(events);
};

// get single event
const getEventById = async (received, callback) => {
  const { _id } = received;

  // TODO: handle that error
  // if (!mongoose.Types.ObjectId.isValid(_id)) {
  //   return res.status(404).json({ error: "EVENT_NOT_FOUND" });
  // }

  const event = await EventModel.findById(_id);

  // TODO: handle that error
  // if (!event) {
  //   return res.status(404).json({ error: "EVENT_NOT_FOUND" });
  // }

  callback(event);
};

// create new event
const createEvent = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { name, date, type } = received;

  const event = await EventModel.create({ name, date, type, team });

  const allEvents = await EventModel.find({ team });

  callback(event);
  io.to(team).emit("events_updated", allEvents);
};

// delete event
const deleteEventById = async (received, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { _id } = received;

  // TODO: handle that
  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "EVENT_NOT_FOUND" });
  // }

  await EventModel.findOneAndDelete({ _id });

  // TODO: handle that
  // if (!event) {
  //   return res.status(400).json({ error: "EVENT_NOT_FOUND" });
  // }

  const allEvents = await EventModel.find({ team });

  io.to(team).emit("events_updated", allEvents);
};

// update event
const updateEventById = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { _id } = received;

  // TODO: handle that
  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "EVENT_NOT_FOUND" });
  // }

  const event = await EventModel.findOneAndUpdate(
    { _id },
    { ...received },
    { new: true }
  );

  // TODO: handle that
  // if (!event) {
  //   return res.status(404).json({ error: "EVENT_NOT_FOUND" });
  // }

  const allEvents = await EventModel.find({ team });

  callback(event);
  io.to(team).emit("events_updated", allEvents);
};

const toggleEventDog = async (received, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { _id, dogId } = received;

  // TODO: handle that
  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "EVENT_NOT_FOUND" });
  // }

  const event = await EventModel.findById(_id, "dogs");

  if (!event) {
    return;
  }

  const dogFound = event.dogs.find(
    ({ _id: currentDogId }) => currentDogId.toString() === dogId
  );

  if (dogFound && dogFound?.status === "PRESENT") {
    const updatedDogsList = [
      ...event.dogs.filter(
        ({ _id: currentDogId }) => currentDogId.toString() !== dogId
      ),
      { _id: dogId, status: "ABSENT" },
    ];

    await EventModel.findOneAndUpdate({ _id }, { dogs: updatedDogsList });
  } else if (dogFound && dogFound?.status === "ABSENT") {
    const updatedDogsList = event.dogs.filter(
      ({ _id: currentDogId }) => currentDogId.toString() !== dogId
    );

    await EventModel.findOneAndUpdate({ _id }, { dogs: updatedDogsList });
  } else {
    const updatedDogsList = [
      ...event.dogs.filter(
        ({ _id: currentDogId }) => currentDogId.toString() !== dogId
      ),
      { _id: dogId, status: "PRESENT" },
    ];

    await EventModel.findOneAndUpdate({ _id }, { dogs: updatedDogsList });
  }

  // TODO: handle that
  // if (!event) {
  //   return res.status(404).json({ error: "EVENT_NOT_FOUND" });
  // }

  const allEvents = await EventModel.find({ team });
  io.to(team).emit("events_updated", allEvents);
};

const toggleEventUserId = async (received, io, userToken) => {
  const { team } = jwt.decode(userToken);

  const { _id, userId } = received;

  // TODO: handle that
  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "EVENT_NOT_FOUND" });
  // }

  const event = await EventModel.findById(_id, "users");

  if (!event) {
    return;
  }

  const userFound = event.users.find(
    ({ _id: currentUserId }) => currentUserId.toString() === userId
  );

  if (userFound && userFound?.status === "PRESENT") {
    const updatedUsersList = [
      ...event.users.filter(
        ({ _id: currentUserId }) => currentUserId.toString() !== userId
      ),
      { _id: userId, status: "ABSENT" },
    ];

    await EventModel.findOneAndUpdate({ _id }, { users: updatedUsersList });
  } else if (userFound && userFound?.status === "ABSENT") {
    const updatedUsersList = [
      ...event.users.filter(
        ({ _id: currentUserId }) => currentUserId.toString() !== userId
      ),
    ];

    await EventModel.findOneAndUpdate({ _id }, { users: updatedUsersList });
  } else {
    const updatedUsersList = [
      ...event.users.filter(
        ({ _id: currentUserId }) => currentUserId.toString() !== userId
      ),
      { _id: userId, status: "PRESENT" },
    ];

    await EventModel.findOneAndUpdate({ _id }, { users: updatedUsersList });
  }

  // TODO: handle that
  // if (!event) {
  //   return res.status(404).json({ error: "EVENT_NOT_FOUND" });
  // }

  const allEvents = await EventModel.find({ team });
  io.to(team).emit("events_updated", allEvents);
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  deleteEventById,
  updateEventById,
  toggleEventDog,
  toggleEventUserId,
};
