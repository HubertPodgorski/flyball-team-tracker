// Off by default nowhere - every existing club keeps current behavior until
// a trainer actively turns something off.
const DEFAULT_FEATURES = {
  teamsAndLineups: true,
  crossPasses: true,
  eventsCalendar: true,
  dogTasksCatalog: true,
  usefulResources: true,
  netTime: true,
};

// Each dependency cascades one level down: no lineups -> no cross-passes ->
// no net time (it's just a sum of the per-dog times cross-passes track).
const normalizeFeatures = (features) => {
  const normalized = { ...DEFAULT_FEATURES, ...features };

  if (!normalized.teamsAndLineups) normalized.crossPasses = false;
  if (!normalized.crossPasses) normalized.netTime = false;

  return normalized;
};

module.exports = { DEFAULT_FEATURES, normalizeFeatures };
