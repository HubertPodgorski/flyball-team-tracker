import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import superAdminControllerModule from "./superAdminController.js";
import taskControllerModule from "./taskController.js";
import testHelpersModule from "../testHelpers.js";
import { teamForClubCode, getClubTeams, isClubSuspended } from "../helpers/clubs.js";

const { getClubs, createClub, updateClub, deleteClub } = superAdminControllerModule;
const { getTasks } = taskControllerModule;
const { mockRes } = testHelpersModule;

const ClubModel = mongoose.model("Club");
const UserModel = mongoose.model("User");
const DogModel = mongoose.model("Dog");

describe("superAdmin clubs", () => {
  it("lists the seeded default clubs", async () => {
    const res = mockRes();

    await getClubs({}, res);

    expect(res.body.map((club) => club.code)).toContain("TEST");
    expect(res.body.find((club) => club.code === "TEST").team).toBe("TEST_TEAM");
  });

  it("createClub adds a usable signup code and refreshes the cache", async () => {
    const res = mockRes();

    await createClub({ body: { code: "NEWCODE", team: "NEW_CLUB", name: "New Club" } }, res);

    expect(res.statusCode).toBe(200);
    expect(teamForClubCode("NEWCODE")).toBe("NEW_CLUB");
    expect(getClubTeams()).toContain("NEW_CLUB");
  });

  it("createClub rejects a duplicate code or team", async () => {
    const res = mockRes();

    await createClub({ body: { code: "TEST", team: "ANOTHER", name: "Dupe" } }, res);

    expect(res.statusCode).toBe(409);
  });

  it("updateClub toggles suspended and the cache reflects it immediately", async () => {
    const club = await ClubModel.findOne({ code: "TEST" });
    const res = mockRes();

    await updateClub({ body: { _id: club._id.toString(), suspended: true } }, res);

    expect(res.body.suspended).toBe(true);
    expect(isClubSuspended("TEST_TEAM")).toBe(true);
  });

  it("deleteClub wipes every document in the club and the club row itself", async () => {
    await createClub({ body: { code: "DOOMED", team: "DOOMED_CLUB", name: "Doomed" } }, mockRes());
    await UserModel.create({ name: "U", email: "u@doomed.test", password: "x", team: "DOOMED_CLUB" });
    await DogModel.create({ name: "Rex", team: "DOOMED_CLUB" });

    const club = await ClubModel.findOne({ team: "DOOMED_CLUB" });
    const res = mockRes();

    await deleteClub({ params: { _id: club._id.toString() } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.deleted.User).toBe(1);
    expect(res.body.deleted.Dog).toBe(1);
    expect(await ClubModel.countDocuments({ team: "DOOMED_CLUB" })).toBe(0);
    expect(await UserModel.countDocuments({ team: "DOOMED_CLUB" })).toBe(0);
    expect(getClubTeams()).not.toContain("DOOMED_CLUB");
  });
});

describe("suspended club is read-only", () => {
  it("blocks a write (createTask via the route middleware is out of scope here - assert the flag drives isClubSuspended)", async () => {
    const club = await ClubModel.findOne({ code: "TEST" });

    await updateClub({ body: { _id: club._id.toString(), suspended: true } }, mockRes());
    expect(isClubSuspended("TEST_TEAM")).toBe(true);

    // GET-shaped reads still work.
    const res = mockRes();
    await getTasks({ club: "TEST_TEAM", query: {} }, res);
    expect(res.statusCode).toBe(200);
  });
});
