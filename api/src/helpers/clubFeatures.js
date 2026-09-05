// Off by default nowhere - every existing club keeps current behavior until
// a trainer actively turns something off.
const DEFAULT_FEATURES = {
  teamsAndLineups: true,
  crossPasses: true,
  eventsCalendar: true,
  dogTasksCatalog: true,
};

// Cross-passes only make sense tied to a lineup here - turning lineups off
// takes cross-passes down with it, regardless of what was requested.
const normalizeFeatures = (features) => {
  const normalized = { ...DEFAULT_FEATURES, ...features };

  if (!normalized.teamsAndLineups) normalized.crossPasses = false;

  return normalized;
};

module.exports = { DEFAULT_FEATURES, normalizeFeatures };
