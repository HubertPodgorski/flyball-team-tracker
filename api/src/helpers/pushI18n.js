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
    testNotification: () => ({
      title: "Test notification",
      body: "If you can see this, push notifications are working!",
    }),
    // No eventId - a batch of events has no single one worth deep-linking to.
    recurringEventsCreated: (eventName, count) => ({
      title: "New events",
      body: `${count} new ${eventName} sessions added`,
    }),
  },
  pl: {
    newEvent: (eventName, eventId) => ({ title: "Nowe wydarzenie", body: eventName, eventId }),
    attendanceReminder: (eventName, eventId) => ({
      title: "Przypomnienie o obecności",
      body: `Nie zapomnij zaznaczyć swojej obecności na "${eventName}"`,
      eventId,
    }),
    testNotification: () => ({
      title: "Powiadomienie testowe",
      body: "Jeśli to widzisz, powiadomienia push działają!",
    }),
    recurringEventsCreated: (eventName, count) => ({
      title: "Nowe wydarzenia",
      body: `Dodano ${count} nowych sesji: ${eventName}`,
    }),
  },
};

const buildPushPayload = (language, messageKey, ...args) => {
  const locale = MESSAGES[language] ? language : "pl";

  return MESSAGES[locale][messageKey](...args);
};

module.exports = { buildPushPayload };
