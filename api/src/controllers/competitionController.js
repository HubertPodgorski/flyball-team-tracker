const fs = require("fs/promises");
const EventModel = require("../models/eventModel");
const DogModel = require("../models/dogModel");
const TeamModel = require("../models/teamModel");
const CompetitionEntryModel = require("../models/competitionEntryModel");
const { readEjsSheet } = require("../helpers/xlsColors");
const { parseEjsRows } = require("../helpers/ejsParser");
const { matchDogNames } = require("../helpers/dogNameMatcher");
const { buildLineupIndex, matchLineup } = require("../helpers/lineupMatcher");
const { computeStatsForAllDogs } = require("../helpers/competitionStats");

// Parses and deletes each file's temp copy regardless of success; sourceFile is the only thing distinguishing rows across a multi-file import.
const parseUploadedFiles = async (files) => {
  const entries = [];

  for (const file of files) {
    try {
      const rows = await readEjsSheet(file.path);

      entries.push(...parseEjsRows(rows).map((entry) => ({ ...entry, sourceFile: file.originalname })));
    } finally {
      await fs.unlink(file.path).catch(() => {});
    }
  }

  return entries;
};

// A malformed .xls (readEjsSheet rejects rather than risk crashing the process on it) is a 400, not a 500 - same shape as every other validation error here.
const parseUploadedFilesOrRespond = async (files, res) => {
  try {
    return await parseUploadedFiles(files);
  } catch (error) {
    res.status(400).json({ error: "COULD_NOT_READ_FILE" });
    return null;
  }
};

// Only a COMPETITION event in the caller's own club is a valid import target.
const findCompetitionEvent = (eventId, club) => EventModel.findOne({ _id: eventId, team: club });

const parseOurTeamNames = (raw) => new Set(JSON.parse(raw || "[]"));

// One name -> matchedDogId map, built once per unique dog name among "our team" rows, so every occurrence of that name resolves the same way.
const buildMatchMap = async (entries, ourTeamNames, club) => {
  const ourNames = [
    ...new Set(entries.filter((entry) => ourTeamNames.has(entry.teamName)).flatMap((entry) => entry.dogs.map((dog) => dog.name).filter(Boolean))),
  ];
  const clubDogs = await DogModel.find({ team: club });
  const matches = matchDogNames(ourNames, clubDogs);

  return new Map(matches.map((match) => [match.name, match]));
};

const resolveMatchedDogId = (dog, ourTeam, matchMap, overrides) => {
  if (!ourTeam || !dog.name) return null;

  const match = matchMap.get(dog.name);

  return overrides[dog.name] ?? (match ? match.matchedDogId : null);
};

// suggestions is preview-only data; runningOnDogId is separate from the real CrossPass collection - just this row's own running order.
const applyMatchesToEntry = (entry, ourTeamNames, matchMap, overrides, lineupIndex) => {
  const ourTeam = ourTeamNames.has(entry.teamName);
  const matchedDogIds = entry.dogs.map((dog) => resolveMatchedDogId(dog, ourTeam, matchMap, overrides));

  return {
    ...entry,
    ourTeam,
    matchedLineupId: ourTeam ? matchLineup(matchedDogIds, lineupIndex) : null,
    dogs: entry.dogs.map((dog, index) => ({
      ...dog,
      matchedDogId: matchedDogIds[index],
      runningOnDogId: index === 0 ? null : matchedDogIds[index - 1],
      suggestions: ourTeam && dog.name ? (matchMap.get(dog.name) || {}).suggestions || [] : [],
    })),
  };
};

// Preview only - nothing persisted. Without ourTeamNames, just lists every team name found so the trainer can pick which are theirs.
const previewEjsImport = async (req, res) => {
  const event = await findCompetitionEvent(req.params.eventId, req.club);

  if (!event) return res.status(404).json({ error: "COMPETITION_EVENT_NOT_FOUND" });

  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "NO_FILES_UPLOADED" });

  const entries = await parseUploadedFilesOrRespond(req.files, res);

  if (!entries) return;

  const teamNames = [...new Set(entries.map((entry) => entry.teamName))].sort();

  if (!req.body.ourTeamNames) return res.status(200).json({ teamNames });

  const ourTeamNames = parseOurTeamNames(req.body.ourTeamNames);
  const matchMap = await buildMatchMap(entries, ourTeamNames, req.club);
  const lineupIndex = buildLineupIndex(await TeamModel.find({ team: req.club }));
  const previewEntries = entries
    .filter((entry) => ourTeamNames.has(entry.teamName))
    .map((entry) => applyMatchesToEntry(entry, ourTeamNames, matchMap, {}, lineupIndex));

  res.status(200).json({ teamNames, entries: previewEntries });
};

// Persists every parsed row - both "our" (dog-matched) and opponent rows (kept for heat context, matchedDogId always null).
const confirmEjsImport = async (req, res) => {
  const event = await findCompetitionEvent(req.params.eventId, req.club);

  if (!event) return res.status(404).json({ error: "COMPETITION_EVENT_NOT_FOUND" });

  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "NO_FILES_UPLOADED" });

  const entries = await parseUploadedFilesOrRespond(req.files, res);

  if (!entries) return;

  const ourTeamNames = parseOurTeamNames(req.body.ourTeamNames);
  const overrides = JSON.parse(req.body.dogNameOverrides || "{}");
  const matchMap = await buildMatchMap(entries, ourTeamNames, req.club);
  const lineupIndex = buildLineupIndex(await TeamModel.find({ team: req.club }));
  const documents = entries.map((entry) => ({
    ...applyMatchesToEntry(entry, ourTeamNames, matchMap, overrides, lineupIndex),
    eventId: event._id,
    team: req.club,
  }));

  try {
    // A confirm always replaces the whole event's data, not just the uploaded file(s)' own rows - a mistaken earlier day's import can't linger once you re-confirm.
    await CompetitionEntryModel.deleteMany({ eventId: event._id });

    const created = await CompetitionEntryModel.insertMany(documents);

    res.status(200).json({ count: created.length });
  } catch (error) {
    // An unexpected cell shape our schema doesn't yet cover - a 500, not a process crash from an unhandled rejection.
    console.error("EJS import failed to persist:", error);
    res.status(500).json({ error: "IMPORT_FAILED" });
  }
};

// Per-dog effectiveness for one competition event, optionally narrowed to one uploaded file (day) and/or one lineup - never opponent rows.
const getCompetitionStats = async (req, res) => {
  const event = await findCompetitionEvent(req.params.eventId, req.club);

  if (!event) return res.status(404).json({ error: "COMPETITION_EVENT_NOT_FOUND" });

  const filter = { eventId: event._id, ourTeam: true };

  if (req.query.sourceFile) filter.sourceFile = req.query.sourceFile;
  if (req.query.lineupId) filter.matchedLineupId = req.query.lineupId;

  const entries = await CompetitionEntryModel.find(filter);
  const sourceFiles = (await CompetitionEntryModel.find({ eventId: event._id }).distinct("sourceFile")).sort();
  const dogNamesById = new Map((await DogModel.find({ team: req.club })).map((dog) => [dog._id.toString(), dog.name]));
  const dogs = computeStatsForAllDogs(entries).map((stats) => ({ ...stats, name: dogNamesById.get(stats.dogId.toString()) || null }));

  res.status(200).json({ sourceFiles, dogs });
};

module.exports = { previewEjsImport, confirmEjsImport, getCompetitionStats };
