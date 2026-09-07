const EventModel = require("./models/eventModel");
const { findClubUsers } = require("./helpers/clubUsers");
const { sendPushToMembers } = require("./helpers/push");
const { isWithinReminderWindow } = require("./helpers/reminderWindow");

const HOUR_MS = 60 * 60 * 1000;

// Does the actual work for one event, unconditionally (no window check) -
// shared by the cron and the trainer's manual "remind now" button.
const sendReminderForEvent = async (event) => {
  const markedUserIds = new Set((event.users ?? []).map(({ _id }) => _id.toString()));

  const clubUsers = await findClubUsers(event.team);
  const unmarkedMembers = clubUsers.filter((user) => !markedUserIds.has(user._id.toString()));

  if (unmarkedMembers.length > 0) {
    await sendPushToMembers(
      event.team,
      unmarkedMembers,
      "attendanceReminder",
      event.name,
      event._id.toString()
    );
  }

  // Set regardless of whether anyone was unmarked, so the automatic cron
  // never re-fires for this event again either.
  event.reminderSentAt = new Date();
  await event.save();

  return unmarkedMembers.length;
};

const sendAttendanceReminders = async () => {
  const now = new Date();
  const candidates = await EventModel.find({ reminderSentAt: { $exists: false } });

  for (const event of candidates) {
    const eventDate = new Date(event.date);

    if (Number.isNaN(eventDate.getTime())) continue;
    if (!isWithinReminderWindow(eventDate, now)) continue;

    await sendReminderForEvent(event);
  }
};

const startReminderScheduler = () => {
  // setInterval alone only fires after a full hour - useless if the dyno cycles more often than that.
  const runCheck = () =>
    sendAttendanceReminders().catch((error) => console.error("Reminder check failed:", error));

  runCheck();
  setInterval(runCheck, HOUR_MS);
};

module.exports = { sendReminderForEvent, sendAttendanceReminders, startReminderScheduler };
