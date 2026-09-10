const fs = require("fs/promises");
const EventModel = require("../models/eventModel");
const CompetitionEntryModel = require("../models/competitionEntryModel");
const { readEjsFile } = require("../helpers/readEjsFile");
const { parseEjsRows } = require("../helpers/ejsParser");
const { computeStatsForAllOpponentDogs } = require("../helpers/competitionStats");
const { logAppError } = require("../helpers/logAppError");

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

// Only a COMPETITION event in the caller's own club is a valid import target.
const findCompetitionEvent = (eventId, club) => EventModel.findOne({ _id: eventId, team: club });

const parseOurTeamNames = (raw) => new Set(JSON.parse(raw || "[]"));

// A row's own 4-dog running order by name - this is what a "lineup" means for these stats.
const lineupKeyFor = (entry) => entry.dogs.map((dog) => dog.name || "").join("|");

// We only map teams, not dogs - every dog stays as its raw EJS name so nothing is dropped for want of a club-roster match.
const applyTeamFlagToEntry = (entry, ourTeamNames) => {
  const ourTeam = ourTeamNames.has(entry.teamName);

  return {
    ...entry,
    ourTeam,
    lineupKey: ourTeam ? lineupKeyFor(entry) : null,
    dogs: entry.dogs.map((dog) => ({ ...dog, matchedDogId: null, runningOnDogId: null, suggestions: [] })),
  };
};

// Preview only - nothing persisted. Without ourTeamNames, just lists every team name found so the trainer can pick which are theirs.
const previewEjsImport = async (req, res) => {
  const event = await findCompetitionEvent(req.params.eventId, req.club);

  if (!event) return res.status(404).json({ error: "COMPETITION_EVENT_NOT_FOUND" });

  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "NO_FILES_UPLOADED" });

  const entries = await parseUploadedFilesOrRespond(req.files, req, res);

  if (!entries) return;

  const teamNames = [...new Set(entries.map((entry) => entry.teamName))].sort();

  if (!req.body.ourTeamNames) return res.status(200).json({ teamNames });

  const ourTeamNames = parseOurTeamNames(req.body.ourTeamNames);
  const previewEntries = entries
    .filter((entry) => ourTeamNames.has(entry.teamName))
    .map((entry) => applyTeamFlagToEntry(entry, ourTeamNames));

  res.status(200).json({ teamNames, entries: previewEntries });
};

// Persists every parsed row, flagged by whether its team is one of ours; dogs are never matched to the club roster.
const confirmEjsImport = async (req, res) => {
  const event = await findCompetitionEvent(req.params.eventId, req.club);

  if (!event) return res.status(404).json({ error: "COMPETITION_EVENT_NOT_FOUND" });

  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "NO_FILES_UPLOADED" });

  const entries = await parseUploadedFilesOrRespond(req.files, req, res);

  if (!entries) return;

  const ourTeamNames = parseOurTeamNames(req.body.ourTeamNames);
  const documents = entries.map((entry) => ({
    ...applyTeamFlagToEntry(entry, ourTeamNames),
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
    logAppError({ error, req, statusCode: 500, context: { stage: "persist", entryCount: documents.length, files: req.files.map((file) => file.originalname) } });
    res.status(500).json({ error: "IMPORT_FAILED" });
  }
};

// Just the eventIds that already have parsed rows - the stats view only offers competitions you can actually look at.
const getImportedCompetitionIds = async (req, res) => {
  const eventIds = await CompetitionEntryModel.find({ team: req.club }).distinct("eventId");

  res.status(200).json({ eventIds: eventIds.map((id) => id.toString()) });
};

// Shared by the per-event and the all-competitions views - `scopeFilter` is either { eventId } or { team } (every one of the club's).
const respondWithStats = async (scopeFilter, req, res) => {
  // scope=all: every club's rows. Default: only our own team's rows, plus the lineups derived from them.
  const all = req.query.scope === "all";
  const filter = { ...scopeFilter };

  if (!all) filter.ourTeam = true;
  if (req.query.sourceFile) filter.sourceFile = req.query.sourceFile;
  if (!all && req.query.lineupKey) filter.lineupKey = req.query.lineupKey;

  const entries = await CompetitionEntryModel.find(filter);
  const sourceFiles = (await CompetitionEntryModel.find(scopeFilter).distinct("sourceFile")).sort();
  // Every dog is keyed on its raw EJS name and carries its own team name - no matching against the club roster, so nothing is dropped.
  const dogs = computeStatsForAllOpponentDogs(entries);
  const teamNames = [...new Set(dogs.map((dog) => dog.teamName).filter(Boolean))].sort();

  if (all) return res.status(200).json({ sourceFiles, dogs, teamNames, lineups: [] });

  // Every distinct running order in our own scoped rows - a "lineup" derived purely from the imported data.
  const ourEntries = await CompetitionEntryModel.find({ ...scopeFilter, ourTeam: true });
  const lineupsByKey = new Map();

  for (const entry of ourEntries) {
    if (!entry.lineupKey) continue;

    const existing = lineupsByKey.get(entry.lineupKey);

    if (existing) existing.heatCount += 1;
    else lineupsByKey.set(entry.lineupKey, { key: entry.lineupKey, order: entry.dogs.map((dog) => dog.name || "?").join(" → "), heatCount: 1 });
  }

  res.status(200).json({ sourceFiles, dogs, teamNames, lineups: [...lineupsByKey.values()] });
};

// Per-dog effectiveness for one competition event. scope=all switches to every club's rows; otherwise just our own team's, plus lineups.
const getCompetitionStats = async (req, res) => {
  const event = await findCompetitionEvent(req.params.eventId, req.club);

  if (!event) return res.status(404).json({ error: "COMPETITION_EVENT_NOT_FOUND" });

  return respondWithStats({ eventId: event._id }, req, res);
};

// The same stats aggregated across every competition the club has imported.
const getAllCompetitionStats = (req, res) => respondWithStats({ team: req.club }, req, res);

module.exports = { previewEjsImport, confirmEjsImport, getCompetitionStats, getAllCompetitionStats, getImportedCompetitionIds };
