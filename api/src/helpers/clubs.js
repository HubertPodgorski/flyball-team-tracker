const ClubModel = require("../models/clubModel");

// A verbatim copy of the old clubCodeMap (userModel.js) + CLUBS (helpers/teams.js), seeded once when the collection is empty.
const DEFAULT_CLUBS = [
  { code: "DZIKIEGZIKI", team: "DZIKIE_GZIKI", name: "Dzikie Gziki" },
  { code: "FLYVENGERS", team: "FLYVENGERS", name: "Flyvengers" },
  { code: "DZIKIE_GZIKI_NABOR", team: "DZIKIE_GZIKI_NABOR", name: "Dzikie Gziki - nabor" },
  { code: "WEST_SIDE_DOGZ", team: "WEST_SIDE_DOGZ", name: "West Side Dogz" },
  { code: "TEST", team: "TEST_TEAM", name: "Test" },
  { code: "ULTRA_FLYBALL_TEAM", team: "ULTRA_FLYBALL_TEAM", name: "Ultra Flyball Team" },
  { code: "SANDBOX", team: "SANDBOX", name: "Sandbox" },
];

// Stashed on globalThis so a CJS/ESM double-load of this module (vitest setup vs. the controller graph) still shares one cache.
const CACHE_KEY = Symbol.for("flyball.clubsCache");
const emptyCache = () => ({ list: [], codes: [], teams: [], teamByCode: {}, suspendedTeams: new Set() });
const getCache = () => globalThis[CACHE_KEY] || (globalThis[CACHE_KEY] = emptyCache());

const refreshClubsCache = async () => {
  const docs = await ClubModel.find().lean();

  globalThis[CACHE_KEY] = {
    list: docs,
    codes: docs.map((doc) => doc.code),
    teams: docs.map((doc) => doc.team),
    teamByCode: Object.fromEntries(docs.map((doc) => [doc.code, doc.team])),
    suspendedTeams: new Set(docs.filter((doc) => doc.suspended).map((doc) => doc.team)),
  };
};

const ensureClubsSeeded = async () => {
  if ((await ClubModel.estimatedDocumentCount()) === 0) {
    await ClubModel.insertMany(DEFAULT_CLUBS);
  }
};

const getClubTeams = () => getCache().teams;
const getClubCodes = () => getCache().codes;
const teamForClubCode = (code) => getCache().teamByCode[code];
const isValidClub = (team) => getCache().teams.includes(team);
const isClubSuspended = (team) => getCache().suspendedTeams.has(team);
// Display name for a club's `team` string - falls back to the string itself if it's not a known club.
const clubNameForTeam = (team) => (getCache().list.find((club) => club.team === team) || {}).name || team;
// { team, name } pairs for a picker, name-sorted.
const clubsForSelect = () =>
  getCache()
    .list.map((club) => ({ team: club.team, name: club.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

module.exports = {
  DEFAULT_CLUBS,
  refreshClubsCache,
  ensureClubsSeeded,
  getClubTeams,
  getClubCodes,
  teamForClubCode,
  isValidClub,
  isClubSuspended,
  clubNameForTeam,
  clubsForSelect,
};
