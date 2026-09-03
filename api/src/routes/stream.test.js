import { describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { createRequire } from "module";
import { streamHandler } from "./stream.js";
import testHelpersModule from "../testHelpers.js";

const { mockRes } = testHelpersModule;
// createRequire so this shares stream.js's own CJS module instance of sse.js.
const { broadcast } = createRequire(import.meta.url)("../sse");

// Regression coverage for the same vulnerability class already fixed in
// decodeToken.js, missed here because this route verifies its token
// independently (EventSource can't set an Authorization header, so the
// token travels in the query string instead and this handler decodes it
// itself rather than going through the decodeToken middleware). It used to
// call jwt.decode() - anyone could hand-craft a token claiming any club at
// all and open a live SSE stream subscribed to that club's entire
// broadcast feed (every tasks/dogs/teams update), no knowledge of SECRET
// required.
describe("stream route", () => {
  it("rejects a token signed with the wrong secret, even with a well-formed payload", () => {
    const forged = jwt.sign({ club: "TEST_TEAM" }, "totally-wrong-secret-i-made-up");
    const req = { query: { token: forged } };
    const res = mockRes();

    streamHandler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.ended).toBe(true);
  });

  it("rejects an unsigned (alg: none) token", () => {
    const unsigned = jwt.sign({ club: "TEST_TEAM" }, "", { algorithm: "none" });
    const req = { query: { token: unsigned } };
    const res = mockRes();

    streamHandler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.ended).toBe(true);
  });

  it("rejects a missing token", () => {
    const req = { query: {} };
    const res = mockRes();

    streamHandler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.ended).toBe(true);
  });

  it("accepts a token actually signed with SECRET and opens the stream for its club", () => {
    const token = jwt.sign({ club: "TEST_TEAM" }, process.env.SECRET);
    const req = { query: { token }, on: vi.fn() };
    const res = mockRes();
    res.writeHead = vi.fn();
    res.write = vi.fn();

    streamHandler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(req.on).toHaveBeenCalledWith("close", expect.any(Function));
  });

  it("falls back to the old `team` claim for a pre-rename token", () => {
    const oldToken = jwt.sign({ team: "TEST_TEAM" }, process.env.SECRET);
    const req = { query: { token: oldToken }, on: vi.fn() };
    const res = mockRes();
    res.writeHead = vi.fn();
    res.write = vi.fn();

    streamHandler(req, res);
    broadcast("TEST_TEAM", "dogs_updated", []);

    expect(res.write).toHaveBeenCalledWith(expect.stringContaining("dogs_updated"));
  });
});
