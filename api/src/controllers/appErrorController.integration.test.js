import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import appErrorControllerModule from "./appErrorController.js";
import logAppErrorModule from "../helpers/logAppError.js";
import testHelpersModule from "../testHelpers.js";

// See teamController.integration.test.js for why the controller (not the
// model file) is imported to trigger Mongoose model registration.
const { getAppErrors, clearAppErrors } = appErrorControllerModule;
const { logAppError } = logAppErrorModule;
const AppErrorModel = mongoose.model("AppError");
const { mockRes } = testHelpersModule;

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("getAppErrors", () => {
  it("returns every logged error, newest first", async () => {
    await AppErrorModel.create({ message: "older", createdAt: new Date("2026-01-01") });
    await AppErrorModel.create({ message: "newer", createdAt: new Date("2026-02-01") });

    const res = mockRes();
    await getAppErrors({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.map((error) => error.message)).toEqual(["newer", "older"]);
  });

  it("caps the list at 200", async () => {
    await AppErrorModel.insertMany(
      Array.from({ length: 205 }, (_, index) => ({ message: `error ${index}` }))
    );

    const res = mockRes();
    await getAppErrors({}, res);

    expect(res.body).toHaveLength(200);
  });
});

describe("clearAppErrors", () => {
  it("removes every logged error", async () => {
    await AppErrorModel.create({ message: "one" });
    await AppErrorModel.create({ message: "two" });

    const res = mockRes();
    await clearAppErrors({}, res);

    expect(res.statusCode).toBe(200);
    expect(await AppErrorModel.countDocuments()).toBe(0);
  });
});

describe("logAppError", () => {
  it("persists the message, stack, request context and extra context", async () => {
    const error = new Error("boom");
    logAppError({
      error,
      req: { method: "POST", originalUrl: "/competitions/x/ejs-confirm", club: "TEST_TEAM", userId: "u1" },
      statusCode: 500,
      context: { stage: "persist", entryCount: 3 },
    });

    await flush();

    const [logged] = await AppErrorModel.find();
    expect(logged.message).toBe("boom");
    expect(logged.stack).toContain("Error: boom");
    expect(logged.method).toBe("POST");
    expect(logged.route).toBe("/competitions/x/ejs-confirm");
    expect(logged.club).toBe("TEST_TEAM");
    expect(logged.userId).toBe("u1");
    expect(logged.statusCode).toBe(500);
    expect(logged.context).toEqual({ stage: "persist", entryCount: 3 });
  });

  it("accepts a non-Error value without throwing", async () => {
    logAppError({ error: "just a string" });

    await flush();

    const [logged] = await AppErrorModel.find();
    expect(logged.message).toBe("just a string");
  });
});
