import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import superAdminControllerModule from "./superAdminController.js";
import userControllerModule from "./userController.js";
import testHelpersModule from "../testHelpers.js";

const { resetUserPassword, deleteItem } = superAdminControllerModule;
const { signup, login } = userControllerModule;
const { mockRes } = testHelpersModule;
const PushSubscriptionModel = mongoose.model("PushSubscription");

// Unlike userController.resetUserPassword (trainer, own club only - see
// userController.integration.test.js), this one is deliberately unscoped:
// a super-admin can reset any club's member's password. That's the one
// behavior actually worth pinning down here directly, rather than only
// through the much slower full e2e round trip (super-admin-users.spec.ts).
describe("superAdminController.resetUserPassword", () => {
  it("resets a password for a user in any club, not just the caller's own", async () => {
    const signupRes = mockRes();

    await signup(
      {
        body: {
          name: "Cross Club Target",
          email: "cross-club-target@example.com",
          password: "original-password",
          clubCode: "FLYVENGERS",
        },
      },
      signupRes
    );

    const userId = signupRes.body.user._id;

    const resetRes = mockRes();

    await resetUserPassword({ params: { _id: userId } }, resetRes);

    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.body.temporaryPassword).toBeTypeOf("string");
    expect(resetRes.body.temporaryPassword.length).toBeGreaterThan(0);

    const oldPasswordLogin = mockRes();

    await login(
      {
        body: {
          email: "cross-club-target@example.com",
          password: "original-password",
        },
      },
      oldPasswordLogin
    );

    expect(oldPasswordLogin.statusCode).toBe(400);

    const newPasswordLogin = mockRes();

    await login(
      {
        body: {
          email: "cross-club-target@example.com",
          password: resetRes.body.temporaryPassword,
        },
      },
      newPasswordLogin
    );

    expect(newPasswordLogin.statusCode).toBe(200);
  });

  it("returns 404 for a user id that doesn't exist", async () => {
    const res = mockRes();

    await resetUserPassword({ params: { _id: "000000000000000000000000" } }, res);

    expect(res.statusCode).toBe(404);
  });
});

// Same cascade as userController's deleteUser test - the super-admin grid
// is users' OTHER delete path and needs it too.
describe("superAdminController.deleteItem (users) - push subscription cascade", () => {
  it("deletes the removed user's push subscriptions", async () => {
    const signupRes = mockRes();

    await signup(
      {
        body: {
          name: "Grid Deleted",
          email: "grid-deleted@example.com",
          password: "password123",
          clubCode: "TEST",
        },
      },
      signupRes
    );

    const userId = signupRes.body.user._id;

    await PushSubscriptionModel.create({
      endpoint: "https://push.example.com/grid-deleted",
      keys: { p256dh: "p256dh", auth: "auth" },
      userId,
      team: "TEST_TEAM",
    });

    const res = mockRes();

    await deleteItem("users")(
      { params: { _id: userId }, query: { team: "TEST_TEAM" } },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(await PushSubscriptionModel.findOne({ userId })).toBeNull();
  });
});
