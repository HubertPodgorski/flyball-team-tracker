import { describe, expect, it, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

import competitionControllerModule from "./competitionController.js";
import testHelpersModule from "../testHelpers.js";

const { previewEjsImport, confirmEjsImport, getCompetitionStats } = competitionControllerModule;
const { mockRes } = testHelpersModule;
const EventModel = mongoose.model("Event");
const DogModel = mongoose.model("Dog");
const TeamModel = mongoose.model("Team");
const CompetitionEntryModel = mongoose.model("CompetitionEntry");

const CLUB = "TEST_TEAM";
const FIXTURE_PATH = path.join(__dirname, "fixtures", "ejs-sample.xls");

// Mirrors what multer's diskStorage really does: a fresh temp copy per request (with the client's own filename kept), which the controller deletes after parsing.
const uploadFixture = async (originalname = "ejs-sample.xls") => {
  const tempPath = path.join(os.tmpdir(), crypto.randomUUID());

  await fs.copyFile(FIXTURE_PATH, tempPath);

  return [{ path: tempPath, originalname }];
};

const makeDog = (name) => DogModel.create({ name, team: CLUB });

describe("previewEjsImport", () => {
  let event;

  beforeEach(async () => {
    event = await EventModel.create({ name: "Test Comp", date: "2026-01-01", type: "COMPETITION", team: CLUB });
  });

  it("without ourTeamNames, lists every team name found and nothing else", async () => {
    const res = mockRes();

    await previewEjsImport({ club: CLUB, params: { eventId: event._id.toString() }, files: await uploadFixture(), body: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.teamNames).toEqual(["Fixture Team A", "Fixture Team B"]);
    expect(res.body.entries).toBeUndefined();
  });

  it("with ourTeamNames, previews only that team's rows, auto-matched against the club's own dogs", async () => {
    await makeDog("Rex");
    await makeDog("Fido");
    await makeDog("Buddy");
    await makeDog("Max");

    const res = mockRes();

    await previewEjsImport(
      {
        club: CLUB,
        params: { eventId: event._id.toString() },
        files: await uploadFixture(),
        body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) },
      },
      res
    );

    expect(res.body.entries).toHaveLength(1);

    const [entry] = res.body.entries;

    expect(entry.teamName).toBe("Fixture Team A");
    expect(entry.ourTeam).toBe(true);
    expect(entry.dogs.map((dog) => dog.name)).toEqual(["Rex", "Fido", "Buddy", "Max"]);
    expect(entry.dogs.every((dog) => dog.matchedDogId)).toBe(true);
    expect(entry.dogs[0].runningOnLights).toBe(true);
    expect(entry.dogs[0].runningOnDogId).toBeNull();
    // each dog 2-4 crossed on the previous dog's own matched club-dog id, not just its raw EJS name.
    expect(entry.dogs[1].runningOnDogId).toBe(entry.dogs[0].matchedDogId);
    expect(entry.dogs[2].runningOnDogId).toBe(entry.dogs[1].matchedDogId);
    expect(entry.dogs[3].runningOnDogId).toBe(entry.dogs[2].matchedDogId);
  });

  it("leaves a dog with no close club match unmatched, with suggestions for manual review", async () => {
    await makeDog("Completely Different Dog");

    const res = mockRes();

    await previewEjsImport(
      {
        club: CLUB,
        params: { eventId: event._id.toString() },
        files: await uploadFixture(),
        body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) },
      },
      res
    );

    const rex = res.body.entries[0].dogs.find((dog) => dog.name === "Rex");

    expect(rex.matchedDogId).toBeNull();
    expect(rex.suggestions.length).toBeGreaterThan(0);
  });

  it("404s for an eventId that doesn't belong to the caller's own club", async () => {
    const res = mockRes();

    await previewEjsImport({ club: "OTHER_CLUB", params: { eventId: event._id.toString() }, files: await uploadFixture(), body: {} }, res);

    expect(res.statusCode).toBe(404);
  });

  it("400s when no files are uploaded", async () => {
    const res = mockRes();

    await previewEjsImport({ club: CLUB, params: { eventId: event._id.toString() }, files: [], body: {} }, res);

    expect(res.statusCode).toBe(400);
  });

  it("400s cleanly on a malformed .xls, instead of crashing", async () => {
    const realBytes = await fs.readFile(FIXTURE_PATH);
    const truncatedPath = path.join(os.tmpdir(), crypto.randomUUID());

    await fs.writeFile(truncatedPath, realBytes.subarray(0, realBytes.length - 93));

    const res = mockRes();

    await previewEjsImport(
      { club: CLUB, params: { eventId: event._id.toString() }, files: [{ path: truncatedPath, originalname: "bad.xls" }], body: {} },
      res
    );

    expect(res.statusCode).toBe(400);
  });
});

describe("confirmEjsImport", () => {
  let event;

  beforeEach(async () => {
    event = await EventModel.create({ name: "Test Comp", date: "2026-01-01", type: "COMPETITION", team: CLUB });
  });

  it("persists one entry per row, matching dogs only on the confirmed 'our team' row", async () => {
    await makeDog("Rex");
    await makeDog("Fido");
    await makeDog("Buddy");
    await makeDog("Max");

    const res = mockRes();

    await confirmEjsImport(
      {
        club: CLUB,
        params: { eventId: event._id.toString() },
        files: await uploadFixture(),
        body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) },
      },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(2);

    const stored = await CompetitionEntryModel.find({ eventId: event._id }).sort({ race: 1 });

    expect(stored).toHaveLength(2);
    expect(stored[0].teamName).toBe("Fixture Team A");
    expect(stored[0].ourTeam).toBe(true);
    expect(stored[0].dogs.every((dog) => dog.matchedDogId)).toBe(true);
    expect(stored[1].teamName).toBe("Fixture Team B");
    expect(stored[1].ourTeam).toBe(false);
    expect(stored[1].dogs.every((dog) => !dog.matchedDogId)).toBe(true);
    expect(stored.every((entry) => entry.sourceFile === "ejs-sample.xls")).toBe(true);
  });

  // Regression: a real EJS file's unexpected cell shape once threw an uncaught Mongoose ValidationError out of this handler and crashed the process.
  it("500s instead of crashing when persisting the parsed rows unexpectedly fails", async () => {
    vi.spyOn(CompetitionEntryModel, "insertMany").mockRejectedValueOnce(new Error("boom"));

    const res = mockRes();

    await expect(
      confirmEjsImport(
        {
          club: CLUB,
          params: { eventId: event._id.toString() },
          files: await uploadFixture(),
          body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) },
        },
        res
      )
    ).resolves.not.toThrow();

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "IMPORT_FAILED" });

    vi.restoreAllMocks();
  });

  it("sets matchedLineupId when the 4 matched dogs run in the exact order of a registered lineup", async () => {
    const rex = await makeDog("Rex");
    const fido = await makeDog("Fido");
    const buddy = await makeDog("Buddy");
    const max = await makeDog("Max");

    await TeamModel.create({
      name: "A Team",
      team: CLUB,
      dogs: [rex, fido, buddy, max],
      matchups: [{ name: "Lineup 1", dogs: [rex, fido, buddy, max] }],
    });

    const res = mockRes();

    await confirmEjsImport(
      {
        club: CLUB,
        params: { eventId: event._id.toString() },
        files: await uploadFixture(),
        body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) },
      },
      res
    );

    const stored = await CompetitionEntryModel.findOne({ eventId: event._id, teamName: "Fixture Team A" });
    const [team] = await TeamModel.find({ team: CLUB });

    expect(stored.matchedLineupId.toString()).toBe(team.matchups[0]._id.toString());
  });

  it("applies a manual dogNameOverrides correction over the automatic match", async () => {
    const correctDog = await makeDog("Rex The Second");

    const res = mockRes();

    await confirmEjsImport(
      {
        club: CLUB,
        params: { eventId: event._id.toString() },
        files: await uploadFixture(),
        body: {
          ourTeamNames: JSON.stringify(["Fixture Team A"]),
          dogNameOverrides: JSON.stringify({ Rex: correctDog._id.toString() }),
        },
      },
      res
    );

    const stored = await CompetitionEntryModel.findOne({ eventId: event._id, teamName: "Fixture Team A" });
    const rex = stored.dogs.find((dog) => dog.name === "Rex");

    expect(rex.matchedDogId.toString()).toBe(correctDog._id.toString());
  });

  it("re-importing the same file overwrites its own entries instead of duplicating them", async () => {
    const importOnce = async () =>
      confirmEjsImport(
        { club: CLUB, params: { eventId: event._id.toString() }, files: await uploadFixture("day1.xls"), body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) } },
        mockRes()
      );

    await importOnce();
    await importOnce();

    expect(await CompetitionEntryModel.countDocuments({ eventId: event._id })).toBe(2);
  });

  // A confirm always replaces the whole event, not just the file(s) just uploaded - a mistaken earlier day can't linger unnoticed.
  it("confirming a different file wipes the previous confirm's entries for the whole event", async () => {
    await confirmEjsImport(
      { club: CLUB, params: { eventId: event._id.toString() }, files: await uploadFixture("day1.xls"), body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) } },
      mockRes()
    );
    await confirmEjsImport(
      { club: CLUB, params: { eventId: event._id.toString() }, files: await uploadFixture("day2.xls"), body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) } },
      mockRes()
    );

    const bySourceFile = await CompetitionEntryModel.find({ eventId: event._id }).distinct("sourceFile");

    expect(bySourceFile).toEqual(["day2.xls"]);
    expect(await CompetitionEntryModel.countDocuments({ eventId: event._id })).toBe(2);
  });

  it("uploading multiple files together in one confirm keeps every one of them", async () => {
    const res = mockRes();

    await confirmEjsImport(
      {
        club: CLUB,
        params: { eventId: event._id.toString() },
        files: [...(await uploadFixture("day1.xls")), ...(await uploadFixture("day2.xls"))],
        body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) },
      },
      res
    );

    const bySourceFile = await CompetitionEntryModel.find({ eventId: event._id }).distinct("sourceFile");

    expect(bySourceFile.sort()).toEqual(["day1.xls", "day2.xls"]);
    expect(res.body.count).toBe(4);
  });
});

describe("getCompetitionStats", () => {
  let event;

  beforeEach(async () => {
    event = await EventModel.create({ name: "Test Comp", date: "2026-01-01", type: "COMPETITION", team: CLUB });
    await makeDog("Rex");
    await makeDog("Fido");
    await makeDog("Buddy");
    await makeDog("Max");
  });

  const importDay = async (sourceFile) =>
    confirmEjsImport(
      { club: CLUB, params: { eventId: event._id.toString() }, files: await uploadFixture(sourceFile), body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) } },
      mockRes()
    );

  it("only covers 'our team' dogs, never the opponent row's", async () => {
    await importDay("day1.xls");

    const res = mockRes();

    await getCompetitionStats({ club: CLUB, params: { eventId: event._id.toString() }, query: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.dogs.map((dog) => dog.name).sort()).toEqual(["Buddy", "Fido", "Max", "Rex"]);
    expect(res.body.dogs.every((dog) => dog.totalPasses === 1)).toBe(true);
  });

  it("lists every distinct sourceFile, and narrows dogs to one when filtered by it", async () => {
    // A confirm replaces the whole event, so both days have to be uploaded together in one confirm to coexist.
    await confirmEjsImport(
      {
        club: CLUB,
        params: { eventId: event._id.toString() },
        files: [...(await uploadFixture("day1.xls")), ...(await uploadFixture("day2.xls"))],
        body: { ourTeamNames: JSON.stringify(["Fixture Team A"]) },
      },
      mockRes()
    );

    const res = mockRes();

    await getCompetitionStats({ club: CLUB, params: { eventId: event._id.toString() }, query: {} }, res);

    expect(res.body.sourceFiles).toEqual(["day1.xls", "day2.xls"]);
    expect(res.body.dogs.every((dog) => dog.totalPasses === 2)).toBe(true);

    const dayRes = mockRes();

    await getCompetitionStats({ club: CLUB, params: { eventId: event._id.toString() }, query: { sourceFile: "day1.xls" } }, dayRes);

    expect(dayRes.body.dogs.every((dog) => dog.totalPasses === 1)).toBe(true);
  });

  it("404s for an eventId that doesn't belong to the caller's own club", async () => {
    const res = mockRes();

    await getCompetitionStats({ club: "OTHER_CLUB", params: { eventId: event._id.toString() }, query: {} }, res);

    expect(res.statusCode).toBe(404);
  });
});
