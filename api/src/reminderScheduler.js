const mongoose = require("mongoose");
const EventModel = require("./models/eventModel");
const UserModel = require("./models/userModel");
const PushSubscriptionModel = require("./models/pushSubscriptionModel");
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

  // TEMP DEBUG - remove once the prod remindedCount:0 mystery is solved.
  try {
    const rawTeamMatches = await UserModel.find({ team: event.team }).lean();
    const allUsersEver = await UserModel.countDocuments({});
    const distinctTeams = await UserModel.distinct("team");
    const subscriptionsForTeam = await PushSubscriptionModel.find({ team: event.team }).lean();

    console.log("REMINDER DEBUG", {
      eventId: event._id.toString(),
      eventTeamRaw: JSON.stringify(event.team),
      eventUsers: event.users,
      dbName: mongoose.connection.name,
      dbHost: mongoose.connection.host,
      findClubUsersCount: clubUsers.length,
      findClubUsersIds: clubUsers.map((u) => u._id.toString()),
      unmarkedCount: unmarkedMembers.length,
      rawTeamMatchCount: rawTeamMatches.length,
      rawTeamMatches: rawTeamMatches.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        team: u.team,
        roles: u.roles,
      })),
      totalUsersInDb: allUsersEver,
      distinctTeamValuesInDb: distinctTeams,
      subscriptionsForThisTeamCount: subscriptionsForTeam.length,
    });
  } catch (debugError) {
    console.error("REMINDER DEBUG FAILED", debugError);
  }

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
  setInterval(sendAttendanceReminders, HOUR_MS);
};

module.exports = { sendReminderForEvent, sendAttendanceReminders, startReminderScheduler };
