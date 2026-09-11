const fs = require("fs/promises");
const EventModel = require("../models/eventModel");
const CompetitionEntryModel = require("../models/competitionEntryModel");
const EjsTeamMappingModel = require("../models/ejsTeamMappingModel");
const { readEjsFile } = require("../helpers/readEjsFile");
const { parseEjsRows } = require("../helpers/ejsParser");
const { computeStatsForAllOpponentDogs } = require("../helpers/competitionStats");
const { computePredecessorStats, computeRecords, computeNetVsGross } = require("../helpers/competitionAdvancedStats");
const { clubNameForTeam, clubsForSelect } = require("../helpers/clubs");
const { logAppError } = require("../helpers/logAppError");

// EJS data is one global pool - a super-admin imports it, every club reads it. The `team` field on these rows
// is this sentinel, not a real club; a club "owns" a row when its teamName is in EjsTeamMapping.
const EJS_TEAM = "__EJS__";

// Parses and deletes each file's temp copy regardless of success; sourceFile is the only thing distinguishing rows across a multi-file import.
const parseUploadedFiles = async (files) => {
  const entries = [];

  for (const file of files) {
    try {
      const rows = await readEjsFile(file.path);

      entries.push(...parseEjsRows(rows).map((entry) => ({ ...entry, sourceFile: file.originalname })));
    } finally {
      await fs.unlink(file.path).catch(() => {});
    }
  }

  return entries;
};

// A malformed .xls (readEjsSheet rejects rather than risk crashing the process on it) is a 400, not a 500 - same shape as every other validation error here.
const parseUploadedFilesOrRespond = async (files, req, res) => {
  try {
    return await parseUploadedFiles(files);
  } catch (error) {
    logAppError({ error, req, statusCode: 400, context: { stage: "readEjsSheet", files: files.map((file) => file.originalname) } });
    res.status(400).json({ error: "COULD_NOT_READ_FILE" });
    return null;
  }
};

// A row's own 4-dog running order by name - this is what a "lineup" means for these stats. Blank for name-less bye rows.
const lineupKeyFor = (entry) => {
  const names = entry.dogs.map((dog) => dog.name || "");

  return names.some(Boolean) ? names.join("|") : "";
};

// Dogs stay as their raw EJS names; ownership is resolved per club at read time, so every row gets a lineupKey.
const toStoredEntry = (entry) => ({
  ...entry,
  ourTeam: false,
  lineupKey: lineupKeyFor(entry),
  dogs: entry.dogs.map((dog) => ({ ...dog, matchedDogId: null, runningOnDogId: null, suggestions: [] })),
});

// Preview only - nothing persisted. Lists every team name found and the parsed row count.
const previewEjsImport = async (req, res) => {
  const event = await EventModel.findById(req.params.eventId);

  if (!event) return res.status(404).json({ error: "COMPETITION_EVENT_NOT_FOUND" });

  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "NO_FILES_UPLOADED" });

  const entries = await parseUploadedFilesOrRespond(req.files, req, res);

  if (!entries) return;

  const teamNames = [...new Set(entries.map((entry) => entry.teamName))].sort();

  res.status(200).json({ teamNames, rowCount: entries.length });
};

// Persists every parsed row into the global EJS pool (super-admin only). A confirm replaces the whole event's rows.
const confirmEjsImport = async (req, res) => {
  const event = await EventModel.findById(req.params.eventId);

  if (!event) return res.status(404).json({ error: "COMPETITION_EVENT_NOT_FOUND" });

  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "NO_FILES_UPLOADED" });

  const entries = await parseUploadedFilesOrRespond(req.files, req, res);

  if (!entries) return;

  const documents = entries.map((entry) => ({ ...toStoredEntry(entry), eventId: event._id, team: EJS_TEAM }));

  try {
    await CompetitionEntryModel.deleteMany({ eventId: event._id });

    const created = await CompetitionEntryModel.insertMany(documents);

    res.status(200).json({ count: created.length });
  } catch (error) {
    console.error("EJS import failed to persist:", error);
    logAppError({ error, req, statusCode: 500, context: { stage: "persist", entryCount: documents.length, files: req.files.map((file) => file.originalname) } });
    res.status(500).json({ error: "IMPORT_FAILED" });
  }
};

// Every competition (any club's event) that has imported EJS rows - the shared list every user picks from.
const getEjsCompetitions = async (_req, res) => {
  const eventIds = await CompetitionEntryModel.find({ team: EJS_TEAM }).distinct("eventId");
  const events = await EventModel.find({ _id: { $in: eventIds } })
    .select("_id name date endDate team")
    .sort({ date: -1 });

  res.status(200).json(events);
};

// Kept for the frontend's existing "which events have data" check.
const getImportedCompetitionIds = async (_req, res) => {
  const eventIds = await CompetitionEntryModel.find({ team: EJS_TEAM }).distinct("eventId");

  res.status(200).json({ eventIds: eventIds.map((id) => id.toString()) });
};

const myTeamNamesFor = (club) => EjsTeamMappingModel.find({ club }).distinct("ejsTeamName");

// scopeFilter is { eventId } for one competition, or {} for every imported competition.
const respondWithStats = async (scopeFilter, req, res) => {
  const all = req.query.scope === "all";
  const poolFilter = { ...scopeFilter, team: EJS_TEAM };
  const myTeamNames = await myTeamNamesFor(req.club);
  // An explicit ?teamName= pins the stats (and lineups) to that one team, whatever the scope - the Team tab uses it.
  const pickedTeam = req.query.teamName || null;

  const filter = { ...poolFilter };

  if (pickedTeam) filter.teamName = pickedTeam;
  else if (!all) filter.teamName = { $in: myTeamNames };
  if (req.query.sourceFile) filter.sourceFile = req.query.sourceFile;
  if (req.query.lineupKey) filter.lineupKey = req.query.lineupKey;

  const entries = await CompetitionEntryModel.find(filter);
  const sourceFiles = (await CompetitionEntryModel.find(poolFilter).distinct("sourceFile")).sort();
  const dogs = computeStatsForAllOpponentDogs(entries);
  // Every team name in the competition pool, for the team picker - not just the ones with dogs in the current filter.
  const teamNames = (await CompetitionEntryModel.find(poolFilter).distinct("teamName")).sort();
  // ejsTeamName -> owning club's display name, for the "whole clubs" view that sums a club's teams into one row.
  const teamMappings = await EjsTeamMappingModel.find({ ejsTeamName: { $in: teamNames } });
  const clubByTeamName = Object.fromEntries(teamMappings.map((mapping) => [mapping.ejsTeamName, clubNameForTeam(mapping.club)]));

  // Running orders for the picked team if one was given, else for our own mapped teams.
  const lineupTeamNames = pickedTeam ? [pickedTeam] : myTeamNames;
  const lineupEntries = lineupTeamNames.length
    ? await CompetitionEntryModel.find({ ...poolFilter, teamName: { $in: lineupTeamNames } })
    : [];
  const lineupsByKey = new Map();

  for (const entry of lineupEntries) {
    if (!entry.lineupKey) continue;

    const existing = lineupsByKey.get(entry.lineupKey);

    if (existing) existing.heatCount += 1;
    else
      lineupsByKey.set(entry.lineupKey, {
        key: entry.lineupKey,
        teamName: entry.teamName,
        order: entry.dogs.map((dog) => dog.name || "?").join(" → "),
        heatCount: 1,
      });
  }

  // Extra stats over our own / the picked team's rows: changeover-by-predecessor, records, net-vs-gross time.
  const ownEventIds = [...new Set(lineupEntries.map((entry) => String(entry.eventId)))];
  const ownEvents = ownEventIds.length ? await EventModel.find({ _id: { $in: ownEventIds } }).select("_id name") : [];
  const eventNameById = Object.fromEntries(ownEvents.map((event) => [String(event._id), event.name]));

  res.status(200).json({
    sourceFiles,
    dogs,
    teamNames,
    myTeamNames,
    clubByTeamName,
    lineups: [...lineupsByKey.values()],
    pairings: computePredecessorStats(lineupEntries),
    records: computeRecords(lineupEntries, eventNameById),
    netVsGross: computeNetVsGross(lineupEntries),
  });
};

const getCompetitionStats = async (req, res) => {
  const event = await EventModel.findById(req.params.eventId);

  if (!event) return res.status(404).json({ error: "COMPETITION_EVENT_NOT_FOUND" });

  return respondWithStats({ eventId: event._id }, req, res);
};

const getAllCompetitionStats = (req, res) => respondWithStats({}, req, res);

// Every EJS team name in the pool, every existing mapping, and which of them belong to the caller's own club.
// Any authenticated user - this is what both the trainer's and (read side of) the super-admin's mapping modal read from.
const getGlobalTeamMapping = async (req, res) => {
  const teamNames = (await CompetitionEntryModel.find({ team: EJS_TEAM }).distinct("teamName")).sort();
  const mappings = await EjsTeamMappingModel.find();
  const byName = Object.fromEntries(mappings.map((row) => [row.ejsTeamName, row.club]));

  res.status(200).json({
    teamNames,
    mappings: byName,
    myTeamNames: teamNames.filter((name) => byName[name] === req.club),
  });
};

// Super-admin: same team names + mappings as above, plus the known-club list to suggest in the club picker.
const getAllTeamMappings = async (_req, res) => {
  const teamNames = (await CompetitionEntryModel.find({ team: EJS_TEAM }).distinct("teamName")).sort();
  const mappings = await EjsTeamMappingModel.find();

  res.status(200).json({
    teamNames,
    mappings: Object.fromEntries(mappings.map((row) => [row.ejsTeamName, row.club])),
    clubs: clubsForSelect(),
  });
};

// Upserts `club` as the owner of exactly `ejsTeamNames`, dropping any of its other claims - a full replace, not a diff.
const replaceClubTeamNames = async (club, ejsTeamNames) => {
  await EjsTeamMappingModel.deleteMany({ club, ejsTeamName: { $nin: ejsTeamNames } });

  for (const ejsTeamName of ejsTeamNames) {
    await EjsTeamMappingModel.updateOne(
      { ejsTeamName },
      { $set: { club }, $setOnInsert: { ejsTeamName } },
      { upsert: true }
    );
  }
};

// A club picks exactly which EJS team names are its own, in one go. Can't take a name another club already owns.
const setCompetitionTeamMapping = async (req, res) => {
  const { ejsTeamNames } = req.body;

  if (!Array.isArray(ejsTeamNames)) return res.status(400).json({ error: "MISSING_TEAM_NAMES" });

  const taken = await EjsTeamMappingModel.find({ ejsTeamName: { $in: ejsTeamNames }, club: { $ne: req.club } });

  if (taken.length) return res.status(409).json({ error: "TEAM_NAME_TAKEN", teamNames: taken.map((row) => row.ejsTeamName) });

  await replaceClubTeamNames(req.club, ejsTeamNames);

  res.status(200).json({ ejsTeamNames });
};

// Super-admin: same, but for any club (free text allowed - it only has to line up with what the club itself uses, if
// it is a real club account) and without the ownership check, so opponents can be grouped without a fight over names.
const setAdminTeamMapping = async (req, res) => {
  const { club, ejsTeamNames } = req.body;

  if (!club || !Array.isArray(ejsTeamNames)) return res.status(400).json({ error: "MISSING_CLUB_OR_TEAM_NAMES" });

  await replaceClubTeamNames(club, ejsTeamNames);

  res.status(200).json({ club, ejsTeamNames });
};

module.exports = {
  previewEjsImport,
  confirmEjsImport,
  getEjsCompetitions,
  getImportedCompetitionIds,
  getCompetitionStats,
  getAllCompetitionStats,
  getGlobalTeamMapping,
  setCompetitionTeamMapping,
  getAllTeamMappings,
  setAdminTeamMapping,
  EJS_TEAM,
};
