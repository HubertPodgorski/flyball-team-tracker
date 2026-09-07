// Per-device only, deliberately not synced to the account - declining the
// popup once just means "ask me in Settings instead", not something worth a
// DB round trip.
const DISMISSED_KEY = "pushNotificationsPromptDismissed";

export const isPushPromptDismissed = (): boolean =>
  localStorage.getItem(DISMISSED_KEY) === "true";

export const dismissPushPrompt = (): void => {
  localStorage.setItem(DISMISSED_KEY, "true");
};
