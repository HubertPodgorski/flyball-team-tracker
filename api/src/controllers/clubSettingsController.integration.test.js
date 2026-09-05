import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import clubSettingsControllerModule from "./clubSettingsController.js";
import testHelpersModule from "../testHelpers.js";

// See teamController.integration.test.js for why the controller (not the
// model file) is imported to trigger Mongoose model registration.
const { getClubSettings, updateClubSettings } = clubSettingsControllerModule;
const ClubSettingsModel = mongoose.model("ClubSettings");
const TaskModel = mongoose.model("Task");
const { mockRes } = testHelpersModule;

const CLUB = "TEST_TEAM";

describe("getClubSettings", () => {
  it("creates all-features-on defaults on first read, for a club with no settings yet", async () => {
    const res = mockRes();

    await getClubSettings({ club: CLUB }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.features).toMatchObject({
      teamsAndLineups: true,
      crossPasses: true,
      eventsCalendar: true,
      dogTasksCatalog: true,
    });
  });

  it("only returns the caller's own club settings", async () => {
    await ClubSettingsModel.create({
      team: CLUB,
      features: { teamsAndLineups: false, crossPasses: false },
    });
    await ClubSettingsModel.create({ team: "OTHER_CLUB", features: {} });

    const res = mockRes();

    await getClubSettings({ club: CLUB }, res);

    expect(res.body.team).toBe(CLUB);
    expect(res.body.features.teamsAndLineups).toBe(false);
  });
});

describe("updateClubSettings", () => {
  it("persists a partial feature update, merged onto the existing ones", async () => {
    await ClubSettingsModel.create({ team: CLUB, features: {} });

    const res = mockRes();

    await updateClubSettings({ club: CLUB, body: { features: { eventsCalendar: false } } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.features.eventsCalendar).toBe(false);
    expect(res.body.features.teamsAndLineups).toBe(true);

    const stored = await ClubSettingsModel.findOne({ team: CLUB });

    expect(stored.features.eventsCalendar).toBe(false);
  });

  it("cascades teamsAndLineups off to crossPasses, even if crossPasses wasn't part of this request", async () => {
    await ClubSettingsModel.create({ team: CLUB, features: {} });

    const res = mockRes();

    await updateClubSettings({ club: CLUB, body: { features: { teamsAndLineups: false } } }, res);

    expect(res.body.features.teamsAndLineups).toBe(false);
    expect(res.body.features.crossPasses).toBe(false);
  });

  it("creates the settings doc on first write, for a club with none yet", async () => {
    const res = mockRes();

    await updateClubSettings(
      { club: "BRAND_NEW_CLUB", body: { features: { dogTasksCatalog: false } } },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.features.dogTasksCatalog).toBe(false);
  });

  it("detaches every lineup-linked task when teamsAndLineups turns off, keeping its dogs", async () => {
    await ClubSettingsModel.create({ team: CLUB, features: {} });

    const linkedDogs = [{ _id: new mongoose.Types.ObjectId(), name: "Linked Dog", team: CLUB }];
    const linked = await TaskModel.create({
      team: CLUB,
      description: "Linked task",
      dogs: linkedDogs,
      matchupRef: { squadId: new mongoose.Types.ObjectId(), matchupId: new mongoose.Types.ObjectId() },
      position: { columnIndex: 0, rowIndex: 0, positionIndex: 0 },
    });
    const unlinked = await TaskModel.create({
      team: CLUB,
      description: "Already a plain task",
      dogs: [],
      position: { columnIndex: 0, rowIndex: 1, positionIndex: 0 },
    });
    const otherClubLinked = await TaskModel.create({
      team: "OTHER_CLUB",
      description: "Linked task, different club",
      dogs: [],
      matchupRef: { squadId: new mongoose.Types.ObjectId(), matchupId: new mongoose.Types.ObjectId() },
      position: { columnIndex: 0, rowIndex: 0, positionIndex: 0 },
    });

    await updateClubSettings({ club: CLUB, body: { features: { teamsAndLineups: false } } }, mockRes());

    const storedLinked = await TaskModel.findById(linked._id);
    expect(storedLinked.toJSON().matchupRef).toBeUndefined();
    expect(storedLinked.dogs.map((dog) => dog.name)).toEqual(["Linked Dog"]);

    // Untouched: already unlinked, and a different club's task either way.
    expect((await TaskModel.findById(unlinked._id)).toJSON().matchupRef).toBeUndefined();
    expect((await TaskModel.findById(otherClubLinked._id)).toJSON().matchupRef).toBeDefined();
  });

  it("does not re-run the detach on a save that leaves teamsAndLineups already off", async () => {
    await ClubSettingsModel.create({ team: CLUB, features: { teamsAndLineups: false, crossPasses: false } });

    const linked = await TaskModel.create({
      team: CLUB,
      description: "Linked after the feature was already off",
      dogs: [],
      matchupRef: { squadId: new mongoose.Types.ObjectId(), matchupId: new mongoose.Types.ObjectId() },
      position: { columnIndex: 0, rowIndex: 0, positionIndex: 0 },
    });

    // An unrelated field change, teamsAndLineups already false before and after.
    await updateClubSettings({ club: CLUB, body: { features: { eventsCalendar: false } } }, mockRes());

    // Not the transition this cascade fires on - a task linked after the
    // fact (however that happened) isn't retroactively swept by this call.
    expect((await TaskModel.findById(linked._id)).toJSON().matchupRef).toBeDefined();
  });
});
