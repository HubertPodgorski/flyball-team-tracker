const MAX_MONTHS_AHEAD = 3;

// UTC throughout - local-time methods would tie this to the server's own OS timezone.
const endOfDayUTC = (date) => {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
};

// weekdays are Date.getUTCDay() values (0=Sun..6=Sat); until's whole UTC day is inclusive.
const getRecurringDates = (startDate, weekdays, until) => {
  const weekdaySet = new Set(weekdays);
  const boundary = endOfDayUTC(until).getTime();
  const dates = [];
  const cursor = new Date(startDate);

  while (cursor.getTime() <= boundary) {
    if (weekdaySet.has(cursor.getUTCDay())) {
      dates.push(new Date(cursor));
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

const maxRecurringUntil = (startDate) => {
  const max = new Date(startDate);
  max.setUTCMonth(max.getUTCMonth() + MAX_MONTHS_AHEAD);
  return max;
};

module.exports = { getRecurringDates, maxRecurringUntil };
