const HOUR_MS = 60 * 60 * 1000;

// 2h-wide, not an exact 24h check - hourly polling would miss an exact
// check almost every time. Landing anywhere in here is fine for one nudge.
const WINDOW_START_MS = 23 * HOUR_MS;
const WINDOW_END_MS = 25 * HOUR_MS;

const isWithinReminderWindow = (eventDate, now) => {
  const msUntilEvent = eventDate.getTime() - now.getTime();

  return msUntilEvent >= WINDOW_START_MS && msUntilEvent <= WINDOW_END_MS;
};

module.exports = { isWithinReminderWindow };
