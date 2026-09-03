import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import userControllerModule from "./userController.js";
import testHelpersModule from "../testHelpers.js";

const { signup, login, resetUserPassword, changePassword, getClubCodes } =
  userControllerModule;
const UserModel = mongoose.model("User");
const { mockRes } = testHelpersModule;

describe("signup", () => {
  it("creates a user scoped to the club a valid code maps to", async () => {
    const res = mockRes();

    await signup(
      {
        body: {
          name: "Api User",
          email: "api-user@example.com",
          password: "password123",
          teamCode: "TEST",
        },
      },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.user.team).toBe("TEST_TEAM");
  });

  // The exact production bug: an unrecognized code used to fall through
  // silently, creating a real account with no club at all - nothing ever
  // surfaced as broken until the user found every page empty.
  it("rejects a club code that isn't recognized, without creating a user", async () => {
    const res = mockRes();

    await signup(
      {
        body: {
          name: "Api User",
          email: "orphan@example.com",
          password: "password123",
          teamCode: "NOT_A_REAL_CODE",
        },
      },
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("INVALID_CLUB_CODE");
    expect(await UserModel.findOne({ email: "orphan@example.com" })).toBeNull();
  });

  it("rejects a second signup with an already-registered email", async () => {
    const first = mockRes();

    await signup(
      {
        body: {
          name: "First",
          email: "duplicate@example.com",
          password: "password123",
          teamCode: "TEST",
        },
      },
      first
    );

    expect(first.statusCode).toBe(200);

    const second = mockRes();

    await signup(
      {
        body: {
          name: "Second",
          email: "duplicate@example.com",
          password: "password123",
          teamCode: "TEST",
        },
      },
      second
    );

    expect(second.statusCode).toBe(400);
    expect(second.body.error).toBe("EMAIL_ALREADY_IN_USE");
  });
});

// The frontend used to keep its own separate hardcoded list of valid signup
// codes, which could drift from this one - this endpoint replaces that with
// a single source of truth. The real guarantee worth proving isn't just
// "returns some list", it's that every code this endpoint hands out is one
// signup will actually accept.
describe("getClubCodes", () => {
  it("returns only codes that signup itself accepts", async () => {
    const res = mockRes();

    await getClubCodes({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);

    for (const teamCode of res.body) {
      const signupRes = mockRes();

      await signup(
        {
          body: {
            name: "Code Check",
            email: `code-check-${teamCode}@example.com`,
            password: "password123",
            teamCode,
          },
        },
        signupRes
      );

      expect(signupRes.statusCode).toBe(200);
    }
  });
});

// Regression coverage for a real leak found while building this feature:
// every response carrying a User document (login, signup, the club user
// list, the users_updated broadcast, the super-admin grid) included the
// bcrypt hash, unnoticed since nothing displayed it. res.json() serializes
// through toJSON() - mockRes doesn't, so this asserts against actual
// JSON.stringify output the way a real HTTP response would produce it.
describe("password never reaches the client", () => {
  it("a user document never serializes its password hash", async () => {
    const res = mockRes();

    await signup(
      {
        body: {
          name: "No Leak",
          email: "no-leak@example.com",
          password: "password123",
          teamCode: "TEST",
        },
      },
      res
    );

    const serialized = JSON.parse(JSON.stringify(res.body.user));

    expect(serialized.password).toBeUndefined();
  });
});

describe("resetUserPassword (trainer, own club)", () => {
  it("resets a same-club member's password, and only that returned password works afterward", async () => {
    const signupRes = mockRes();

    await signup(
      {
        body: {
          name: "Reset Target",
          email: "reset-target@example.com",
          password: "original-password",
          teamCode: "TEST",
        },
      },
      signupRes
    );

    const userId = signupRes.body.user._id;

    const resetRes = mockRes();

    await resetUserPassword({ params: { id: userId }, club: "TEST_TEAM" }, resetRes);

    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.body.temporaryPassword).toBeTypeOf("string");
    expect(resetRes.body.temporaryPassword.length).toBeGreaterThan(0);

    const oldPasswordLogin = mockRes();

    await login(
      { body: { email: "reset-target@example.com", password: "original-password" } },
      oldPasswordLogin
    );

    expect(oldPasswordLogin.statusCode).toBe(400);

    const newPasswordLogin = mockRes();

    await login(
      {
        body: {
          email: "reset-target@example.com",
          password: resetRes.body.temporaryPassword,
        },
      },
      newPasswordLogin
    );

    expect(newPasswordLogin.statusCode).toBe(200);
  });

  // The exact cross-tenant mistake to guard against: a trainer resetting a
  // password by id must never reach into a different club just because they
  // guessed/enumerated a valid Mongo _id.
  it("refuses to reset a password for a user in a different club", async () => {
    const signupRes = mockRes();

    await signup(
      {
        body: {
          name: "Other Club User",
          email: "other-club-user@example.com",
          password: "original-password",
          teamCode: "FLYVENGERS",
        },
      },
      signupRes
    );

    const userId = signupRes.body.user._id;

    const resetRes = mockRes();

    // Acting as a trainer from a different club.
    await resetUserPassword({ params: { id: userId }, club: "TEST_TEAM" }, resetRes);

    expect(resetRes.statusCode).toBe(404);

    const loginRes = mockRes();

    await login(
      { body: { email: "other-club-user@example.com", password: "original-password" } },
      loginRes
    );

    expect(loginRes.statusCode).toBe(200);
  });
});

describe("changePassword (self-service)", () => {
  it("changes the password when the current one is confirmed correctly", async () => {
    const signupRes = mockRes();

    await signup(
      {
        body: {
          name: "Self Change",
          email: "self-change@example.com",
          password: "old-password",
          teamCode: "TEST",
        },
      },
      signupRes
    );

    const userId = signupRes.body.user._id;

    const changeRes = mockRes();

    await changePassword(
      {
        userId,
        body: { currentPassword: "old-password", newPassword: "new-password" },
      },
      changeRes
    );

    expect(changeRes.statusCode).toBe(200);

    const loginRes = mockRes();

    await login(
      { body: { email: "self-change@example.com", password: "new-password" } },
      loginRes
    );

    expect(loginRes.statusCode).toBe(200);
  });

  it("rejects the change when the current password is wrong, leaving the real one intact", async () => {
    const signupRes = mockRes();

    await signup(
      {
        body: {
          name: "Wrong Current",
          email: "wrong-current@example.com",
          password: "real-password",
          teamCode: "TEST",
        },
      },
      signupRes
    );

    const userId = signupRes.body.user._id;

    const changeRes = mockRes();

    await changePassword(
      {
        userId,
        body: { currentPassword: "guessed-wrong", newPassword: "new-password" },
      },
      changeRes
    );

    expect(changeRes.statusCode).toBe(400);
    expect(changeRes.body.error).toBe("INCORRECT_PASSWORD");

    const loginRes = mockRes();

    await login(
      { body: { email: "wrong-current@example.com", password: "real-password" } },
      loginRes
    );

    expect(loginRes.statusCode).toBe(200);
  });
});
