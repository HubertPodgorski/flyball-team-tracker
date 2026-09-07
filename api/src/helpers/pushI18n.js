// Tiny hardcoded lookup, not full i18next on the backend - matches this
// bilingual app's existing standard for backend-generated text elsewhere.
// eventId rides along in the payload so the service worker can deep-link a
// notification click straight to that event.
const MESSAGES = {
  en: {
    newEvent: (eventName, eventId) => ({ title: "New event", body: eventName, eventId }),
    attendanceReminder: (eventName, eventId) => ({
      title: "Attendance reminder",
      body: `Don't forget to mark your attendance for "${eventName}"`,
      eventId,
    }),
  },
  pl: {
    newEvent: (eventName, eventId) => ({ title: "Nowe wydarzenie", body: eventName, eventId }),
    attendanceReminder: (eventName, eventId) => ({
      title: "Przypomnienie o obecności",
      body: `Nie zapomnij zaznaczyć swojej obecności na "${eventName}"`,
      eventId,
    }),
  },
};

const buildPushPayload = (language, messageKey, ...args) => {
  const locale = MESSAGES[language] ? language : "pl";

  return MESSAGES[locale][messageKey](...args);
};

module.exports = { buildPushPayload };
