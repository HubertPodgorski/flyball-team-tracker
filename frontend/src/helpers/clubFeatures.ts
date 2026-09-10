import { ClubFeatures } from "./types";

// The one frontend copy of the flag list (the backend keeps its own in api/src/helpers/clubFeatures.js -
// separate deployments, can't share a module). Order here is the order the toggles render in.
export const FEATURE_KEYS: (keyof ClubFeatures)[] = [
  "teamsAndLineups",
  "crossPasses",
  "netTime",
  "eventsCalendar",
  "ejsStats",
  "dogTasksCatalog",
  "usefulResources",
];

// Every flag on - the fallback while the real settings are still loading.
export const ALL_FEATURES_ON: ClubFeatures = FEATURE_KEYS.reduce(
  (all, key) => ({ ...all, [key]: true }),
  {} as ClubFeatures
);
