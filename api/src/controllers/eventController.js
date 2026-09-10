const EventModel = require("../models/eventModel");
const CompetitionEntryModel = require("../models/competitionEntryModel");
const { broadcast } = require("../sse");
const { findClubUsers } = require("../helpers/clubUsers");
const { sendPushToMembers } = require("../helpers/push");
const { sendReminderForEvent } = require("../reminderScheduler");
const { getRecurringDates, maxRecurringUntil } = require("../helpers/recurringEvents");

const findClubEvents = (club) =>
  EventModel.find({ team: club }).sort({ createdAt: -1 });

const getEvents = async (req, res) => {
  const events = await findClubEvents(req.club);

  res.status(200).json(events);
};

const createEvent = async (req, res) => {
  const { name, date, endDate, type } = req.body;

  const event = await EventModel.create({ name, date, endDate, type, team: req.club });

  res.status(200).json(event);
  broadcast(req.club, "events_updated", await findClubEvents(req.club));

  // Fire-and-forget - never blocks the response, and a push failure here
  // shouldn't surface as if creating the event itself had failed.
  findClubUsers(req.club)
    .then((members) => members.filter((member) => member._id.toString() !== req.userId))
    .then((recipients) =>
      sendPushToMembers(req.club, recipients, "newEvent", event.name, event._id.toString())
    )
    .catch((error) => console.error("New-event push failed:", error));
};

// Each generated event is fully independent - no "series" link is stored anywhere.
const createRecurringEvents = async (req, res) => {
  const { name, date, type, weekdays, until } = req.body;

  if (!Array.isArray(weekdays) || weekdays.length === 0) {
    return res.status(400).json({ error: "NO_WEEKDAYS_SELECTED" });
  }

  const startDate = new Date(date);
  const untilDate = new Date(until);

  if (untilDate.getTime() > maxRecurringUntil(startDate).getTime()) {
    return res.status(400).json({ error: "RECURRENCE_TOO_LONG" });
  }

  const dates = getRecurringDates(startDate, weekdays, untilDate);

  if (dates.length === 0) {
    return res.status(400).json({ error: "NO_MATCHING_DATES" });
  }

  const events = await EventModel.insertMany(
    dates.map((eventDate) => ({ name, date: eventDate, type, team: req.club }))
  );

  res.status(200).json(events);
  broadcast(req.club, "events_updated", await findClubEvents(req.club));

  // Fire-and-forget, one combined push for the whole batch, not one per event.
  findClubUsers(req.club)
    .then((members) => members.filter((member) => member._id.toString() !== req.userId))
    .then((recipients) =>
      sendPushToMembers(req.club, recipients, "recurringEventsCreated", name, events.length)
    )
    .catch((error) => console.error("Recurring events push failed:", error));
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
  // Cascade: a competition's parsed EJS rows (global pool, not team-scoped) have no meaning without it - a no-op for other event types.
  await CompetitionEntryModel.deleteMany({ eventId: id });

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

// Trainer-triggered - bypasses the 24h wait and the reminderSentAt guard
// that exists only to stop the automatic cron from repeating.
const sendEventReminder = async (req, res) => {
  const { id } = req.params;

  const event = await EventModel.findOne({ _id: id, team: req.club });

  if (!event) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  const remindedCount = await sendReminderForEvent(event);

  res.status(200).json({ remindedCount });
};

module.exports = {
  getEvents,
  createEvent,
  createRecurringEvents,
  updateEvent,
  deleteEvent,
  toggleEventDog,
  toggleEventUser,
  sendEventReminder,
};
