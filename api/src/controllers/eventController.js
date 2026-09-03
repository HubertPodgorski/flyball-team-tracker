const EventModel = require("../models/eventModel");
const { broadcast } = require("../sse");

const findClubEvents = (club) =>
  EventModel.find({ team: club }).sort({ createdAt: -1 });

const getEvents = async (req, res) => {
  const events = await findClubEvents(req.club);

  res.status(200).json(events);
};

const createEvent = async (req, res) => {
  const { name, date, type } = req.body;

  const event = await EventModel.create({ name, date, type, team: req.club });

  res.status(200).json(event);
  broadcast(req.club, "events_updated", await findClubEvents(req.club));
};

const updateEvent = async (req, res) => {
  const { _id, ...data } = req.body;

  const event = await EventModel.findOneAndUpdate(
    { _id, team: req.club },
    { ...data, team: req.club },
    { returnDocument: "after" }
  );

  if (!event) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  res.status(200).json(event);
  broadcast(req.club, "events_updated", await findClubEvents(req.club));
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;

  await EventModel.findOneAndDelete({ _id: id, team: req.club });

  res.status(200).json({ ok: true });
  broadcast(req.club, "events_updated", await findClubEvents(req.club));
};

// Not present -> PRESENT -> ABSENT -> removed from the list entirely.
const cycleAttendance = (list, id) => {
  const found = list.find(({ _id }) => _id.toString() === id);

  if (found?.status === "PRESENT") {
    return [
      ...list.filter(({ _id }) => _id.toString() !== id),
      { _id: id, status: "ABSENT" },
    ];
  }

  if (found?.status === "ABSENT") {
    return list.filter(({ _id }) => _id.toString() !== id);
  }

  return [
    ...list.filter(({ _id }) => _id.toString() !== id),
    { _id: id, status: "PRESENT" },
  ];
};

const toggleEventDog = async (req, res) => {
  const { id, dogId } = req.params;

  const event = await EventModel.findOne({ _id: id, team: req.club }, "dogs");

  if (!event) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  await EventModel.findOneAndUpdate(
    { _id: id, team: req.club },
    { dogs: cycleAttendance(event.dogs, dogId) }
  );

  res.status(200).json({ ok: true });
  broadcast(req.club, "events_updated", await findClubEvents(req.club));
};

const toggleEventUser = async (req, res) => {
  const { id, userId } = req.params;

  const event = await EventModel.findOne({ _id: id, team: req.club }, "users");

  if (!event) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  await EventModel.findOneAndUpdate(
    { _id: id, team: req.club },
    { users: cycleAttendance(event.users, userId) }
  );

  res.status(200).json({ ok: true });
  broadcast(req.club, "events_updated", await findClubEvents(req.club));
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventDog,
  toggleEventUser,
};
