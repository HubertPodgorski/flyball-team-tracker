import { describe, expect, it, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

import competitionControllerModule from "./competitionController.js";
import testHelpersModule from "../testHelpers.js";

const {
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
} = competitionControllerModule;
const { mockRes } = testHelpersModule;
const EventModel = mongoose.model("Event");
const CompetitionEntryModel = mongoose.model("CompetitionEntry");
const EjsTeamMappingModel = mongoose.model("EjsTeamMapping");

const CLUB = "TEST_TEAM";
const FIXTURE_PATH = path.join(__dirname, "fixtures", "ejs-sample.xls");

// Mirrors multer's diskStorage: a fresh temp copy per request (client filename kept), deleted by the controller after parsing.
const uploadFixture = async (originalname = "ejs-sample.xls") => {
  const tempPath = path.join(os.tmpdir(), crypto.randomUUID());

  await fs.copyFile(FIXTURE_PATH, tempPath);

  return [{ path: tempPath, originalname }];
};

const makeCompetition = (name = "Test Comp") =>
  EventModel.create({ name, date: "2026-01-01", type: "COMPETITION", team: "SUPER_ADMIN_CLUB" });

const importInto = (event, files) =>
  confirmEjsImport({ params: { eventId: event._id.toString() }, files }, mockRes());

const claimTeam = (ejsTeamName, club = CLUB) =>
  setCompetitionTeamMapping({ club, body: { ejsTeamNames: [ejsTeamName] } }, mockRes());

describe("previewEjsImport", () => {
  let event;

  beforeEach(async () => {
    event = await makeCompetition();
  });

  it("lists every team name found plus the parsed row count", async () => {
    const res = mockRes();

    await previewEjsImport({ params: { eventId: event._id.toString() }, files: await uploadFixture(), body: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.teamNames).toEqual(["Fixture Team A", "Fixture Team B"]);
    expect(res.body.rowCount).toBeGreaterThan(0);
  });

  it("404s for an unknown event", async () => {
    const res = mockRes();

    await previewEjsImport(
      { params: { eventId: new mongoose.Types.ObjectId().toString() }, files: await uploadFixture(), body: {} },
      res
    );

    expect(res.statusCode).toBe(404);
  });

  it("400s when no files are uploaded", async () => {
    const res = mockRes();

    await previewEjsImport({ params: { eventId: event._id.toString() }, files: [], body: {} }, res);

    expect(res.statusCode).toBe(400);
  });

  it("400s cleanly on a malformed .xls, instead of crashing", async () => {
    const realBytes = await fs.readFile(FIXTURE_PATH);
    const truncatedPath = path.join(os.tmpdir(), crypto.randomUUID());

    await fs.writeFile(truncatedPath, realBytes.subarray(0, realBytes.length - 93));

    const res = mockRes();

    await previewEjsImport(
      { params: { eventId: event._id.toString() }, files: [{ path: truncatedPath, originalname: "bad.xls" }], body: {} },
      res
    );

    expect(res.statusCode).toBe(400);
  });
});

describe("confirmEjsImport", () => {
  let event;

  beforeEach(async () => {
    event = await makeCompetition();
  });

  it("persists every row into the global EJS pool, with a lineupKey on each", async () => {
    const res = mockRes();

    await confirmEjsImport({ params: { eventId: event._id.toString() }, files: await uploadFixture() }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(2);

    const stored = await CompetitionEntryModel.find({ eventId: event._id }).sort({ race: 1 });

    expect(stored).toHaveLength(2);
    expect(stored.every((entry) => entry.team === EJS_TEAM)).toBe(true);
    expect(stored.every((entry) => typeof entry.lineupKey === "string" && entry.lineupKey.length > 0)).toBe(true);
    expect(stored.map((entry) => entry.teamName).sort()).toEqual(["Fixture Team A", "Fixture Team B"]);
  });

  it("500s instead of crashing when persisting unexpectedly fails", async () => {
    vi.spyOn(CompetitionEntryModel, "insertMany").mockRejectedValueOnce(new Error("boom"));

    const res = mockRes();

    await expect(
      confirmEjsImport({ params: { eventId: event._id.toString() }, files: await uploadFixture() }, res)
    ).resolves.not.toThrow();

    expect(res.statusCode).toBe(500);
    vi.restoreAllMocks();
  });

  it("re-confirming replaces the event's rows rather than duplicating them", async () => {
    await importInto(event, await uploadFixture("day1.xls"));
    await importInto(event, await uploadFixture("day2.xls"));

    expect(await CompetitionEntryModel.countDocuments({ eventId: event._id })).toBe(2);
    expect(await CompetitionEntryModel.find({ eventId: event._id }).distinct("sourceFile")).toEqual(["day2.xls"]);
  });

  it("uploading multiple files in one confirm keeps every one", async () => {
    const res = mockRes();

    await confirmEjsImport(
      {
        params: { eventId: event._id.toString() },
        files: [...(await uploadFixture("day1.xls")), ...(await uploadFixture("day2.xls"))],
      },
      res
    );

    expect(res.body.count).toBe(4);
    expect((await CompetitionEntryModel.find({ eventId: event._id }).distinct("sourceFile")).sort()).toEqual(["day1.xls", "day2.xls"]);
  });
});

describe("getEjsCompetitions / getImportedCompetitionIds", () => {
  it("returns every competition with imported rows, newest first, for any caller", async () => {
    const jan = await EventModel.create({ name: "Jan", date: "2026-01-10", type: "COMPETITION", team: "SUPER_ADMIN_CLUB" });
    const mar = await EventModel.create({ name: "Mar", date: "2026-03-10", type: "COMPETITION", team: "SUPER_ADMIN_CLUB" });
    await EventModel.create({ name: "Empty", date: "2026-02-10", type: "COMPETITION", team: "SUPER_ADMIN_CLUB" });

    await importInto(jan, await uploadFixture());
    await importInto(mar, await uploadFixture());

    const res = mockRes();
    await getEjsCompetitions({ club: "SOME_OTHER_CLUB" }, res);

    expect(res.body.map((event) => event.name)).toEqual(["Mar", "Jan"]);
    // Carries its owning club too - a super-admin needs it to rename the event via /super-admin/events.
    expect(res.body.every((event) => event.team === "SUPER_ADMIN_CLUB")).toBe(true);

    const idsRes = mockRes();
    await getImportedCompetitionIds({ club: "SOME_OTHER_CLUB" }, idsRes);
    expect(idsRes.body.eventIds.sort()).toEqual([jan._id.toString(), mar._id.toString()].sort());
  });
});

describe("team mapping", () => {
  let event;

  beforeEach(async () => {
    event = await makeCompetition();
    await importInto(event, await uploadFixture());
  });

  it("reports every pool team name and which ones the caller's club already owns", async () => {
    const before = mockRes();
    await getGlobalTeamMapping({ club: CLUB }, before);

    expect(before.body.teamNames).toEqual(["Fixture Team A", "Fixture Team B"]);
    expect(before.body.myTeamNames).toEqual([]);

    await claimTeam("Fixture Team A");

    const after = mockRes();
    await getGlobalTeamMapping({ club: CLUB }, after);

    expect(after.body.myTeamNames).toEqual(["Fixture Team A"]);
    expect(after.body.mappings["Fixture Team A"]).toBe(CLUB);
  });

  it("replaces the whole set on every call - a second call drops names no longer listed", async () => {
    await setCompetitionTeamMapping({ club: CLUB, body: { ejsTeamNames: ["Fixture Team A", "Fixture Team B"] } }, mockRes());
    await setCompetitionTeamMapping({ club: CLUB, body: { ejsTeamNames: ["Fixture Team B"] } }, mockRes());

    const res = mockRes();
    await getGlobalTeamMapping({ club: CLUB }, res);

    expect(res.body.myTeamNames).toEqual(["Fixture Team B"]);
  });

  it("won't let a club claim a name another club already owns", async () => {
    await claimTeam("Fixture Team A", "CLUB_ONE");

    const res = mockRes();
    await setCompetitionTeamMapping({ club: "CLUB_TWO", body: { ejsTeamNames: ["Fixture Team A"] } }, res);

    expect(res.statusCode).toBe(409);
  });

  it("400s without a team name array", async () => {
    const res = mockRes();
    await setCompetitionTeamMapping({ club: CLUB, body: {} }, res);
    expect(res.statusCode).toBe(400);
  });
});

describe("admin team mappings", () => {
  let event;

  beforeEach(async () => {
    event = await makeCompetition();
    await importInto(event, await uploadFixture());
  });

  it("lists every pool team name, the existing mappings, and the club list", async () => {
    await claimTeam("Fixture Team A");

    const res = mockRes();
    await getAllTeamMappings({}, res);

    expect(res.body.teamNames).toEqual(["Fixture Team A", "Fixture Team B"]);
    expect(res.body.mappings["Fixture Team A"]).toBe(CLUB);
    expect(res.body.clubs.some((club) => club.team === CLUB && club.name)).toBe(true);
  });

  it("assigns team names to any club - free text included, no ownership check", async () => {
    const set = mockRes();
    await setAdminTeamMapping({ body: { club: "DZIKIE_GZIKI", ejsTeamNames: ["Fixture Team A", "Fixture Team B"] } }, set);

    expect(set.statusCode).toBe(200);
    expect((await EjsTeamMappingModel.find({ club: "DZIKIE_GZIKI" })).map((row) => row.ejsTeamName).sort()).toEqual([
      "Fixture Team A",
      "Fixture Team B",
    ]);

    // Not a real club team code - accepted anyway, it's just a display grouping.
    await setAdminTeamMapping({ body: { club: "Whatever Federation", ejsTeamNames: ["Fixture Team A"] } }, mockRes());
    expect((await EjsTeamMappingModel.findOne({ ejsTeamName: "Fixture Team A" })).club).toBe("Whatever Federation");
  });

  it("a second call for the same club drops names no longer listed", async () => {
    await setAdminTeamMapping({ body: { club: "DZIKIE_GZIKI", ejsTeamNames: ["Fixture Team A", "Fixture Team B"] } }, mockRes());
    await setAdminTeamMapping({ body: { club: "DZIKIE_GZIKI", ejsTeamNames: ["Fixture Team A"] } }, mockRes());

    expect((await EjsTeamMappingModel.find({ club: "DZIKIE_GZIKI" })).map((row) => row.ejsTeamName)).toEqual(["Fixture Team A"]);
  });

  it("400s without a club", async () => {
    const res = mockRes();
    await setAdminTeamMapping({ body: { ejsTeamNames: ["Fixture Team A"] } }, res);

    expect(res.statusCode).toBe(400);
  });
});

describe("getCompetitionStats", () => {
  let event;

  beforeEach(async () => {
    event = await makeCompetition();
    await importInto(event, await uploadFixture("day1.xls"));
  });

  it("returns nothing for the default scope until the club has claimed a team", async () => {
    const res = mockRes();
    await getCompetitionStats({ club: CLUB, params: { eventId: event._id.toString() }, query: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.dogs).toEqual([]);
    expect(res.body.teamNames).toEqual(["Fixture Team A", "Fixture Team B"]);
    expect(res.body.myTeamNames).toEqual([]);
  });

  it("default scope covers only the claimed team's dogs, and derives its lineups", async () => {
    await claimTeam("Fixture Team A");

    const res = mockRes();
    await getCompetitionStats({ club: CLUB, params: { eventId: event._id.toString() }, query: {} }, res);

    expect(res.body.dogs.map((dog) => dog.name).sort()).toEqual(["Buddy", "Fido", "Max", "Rex"]);
    expect(res.body.dogs.every((dog) => dog.teamName === "Fixture Team A")).toBe(true);
    expect(res.body.myTeamNames).toEqual(["Fixture Team A"]);
    // A claimed team resolves to its owning club's display name, for the "whole clubs" summary rows.
    expect(res.body.clubByTeamName["Fixture Team A"]).toBe("Test");
    expect(res.body.lineups).toHaveLength(1);
    expect(res.body.lineups[0].order.split(" → ")).toHaveLength(4);
    expect(res.body.lineups[0].teamName).toBe("Fixture Team A");
    // Extra stats are always present (possibly empty) for the claimed team's own rows.
    expect(Array.isArray(res.body.pairings)).toBe(true);
    expect(res.body.records).toHaveProperty("dogBests");
    expect(res.body).toHaveProperty("netVsGross");
  });

  it("scope=all returns every team's dogs regardless of mapping", async () => {
    const res = mockRes();
    await getCompetitionStats({ club: CLUB, params: { eventId: event._id.toString() }, query: { scope: "all" } }, res);

    expect(res.body.teamNames).toEqual(["Fixture Team A", "Fixture Team B"]);
    expect(res.body.dogs.some((dog) => dog.teamName === "Fixture Team A")).toBe(true);
    expect(res.body.dogs.some((dog) => dog.teamName === "Fixture Team B")).toBe(true);
  });

  it("filters by sourceFile", async () => {
    await claimTeam("Fixture Team A");
    await importInto(event, [...(await uploadFixture("day1.xls")), ...(await uploadFixture("day2.xls"))]);

    const all = mockRes();
    await getCompetitionStats({ club: CLUB, params: { eventId: event._id.toString() }, query: {} }, all);
    expect(all.body.dogs.every((dog) => dog.totalPasses === 2)).toBe(true);

    const oneDay = mockRes();
    await getCompetitionStats({ club: CLUB, params: { eventId: event._id.toString() }, query: { sourceFile: "day1.xls" } }, oneDay);
    expect(oneDay.body.dogs.every((dog) => dog.totalPasses === 1)).toBe(true);
  });

  it("404s for an unknown event", async () => {
    const res = mockRes();
    await getCompetitionStats({ club: CLUB, params: { eventId: new mongoose.Types.ObjectId().toString() }, query: {} }, res);
    expect(res.statusCode).toBe(404);
  });
});

describe("getAllCompetitionStats", () => {
  it("aggregates the claimed team across every imported competition", async () => {
    const first = await makeCompetition("Comp 1");
    const second = await makeCompetition("Comp 2");

    await importInto(first, await uploadFixture());
    await importInto(second, await uploadFixture());
    await claimTeam("Fixture Team A");

    const res = mockRes();
    await getAllCompetitionStats({ club: CLUB, query: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.dogs.map((dog) => dog.name).sort()).toEqual(["Buddy", "Fido", "Max", "Rex"]);
    expect(res.body.dogs.every((dog) => dog.totalPasses === 2)).toBe(true);
  });
});
