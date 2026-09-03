import { describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import decodeToken from "./decodeToken.js";
import testHelpersModule from "../testHelpers.js";

const { mockRes } = testHelpersModule;

// Regression coverage for a real vulnerability: this middleware used to call
// jwt.decode() (parses the payload, checks nothing) instead of jwt.verify()
// (checks the signature against SECRET) - a token hand-crafted with any
// secret at all (no knowledge of the server's real SECRET required) was
// trusted outright, letting anyone claim any club/_id and access that
// club's entire dataset through every route except /super-admin (which
// already verified correctly via requireSuperAdmin.js).
describe("decodeToken", () => {
  it("accepts a token actually signed with SECRET and sets req.club/req.userId from it", () => {
    const token = jwt.sign({ _id: "real-user", club: "TEST_TEAM" }, process.env.SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = vi.fn();

    decodeToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.club).toBe("TEST_TEAM");
    expect(req.userId).toBe("real-user");
  });

  it("rejects a token signed with the wrong secret, even with a well-formed payload", () => {
    const forged = jwt.sign(
      { _id: "attacker", club: "TEST_TEAM" },
      "totally-wrong-secret-i-made-up"
    );
    const req = { headers: { authorization: `Bearer ${forged}` } };
    const res = mockRes();
    const next = vi.fn();

    decodeToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "INVALID_TOKEN" });
    // The exact exploit: club scoping must never come from an unverified payload.
    expect(req.club).toBeUndefined();
  });

  it("rejects an unsigned (alg: none) token", () => {
    const unsigned = jwt.sign({ _id: "attacker", club: "TEST_TEAM" }, "", {
      algorithm: "none",
    });
    const req = { headers: { authorization: `Bearer ${unsigned}` } };
    const res = mockRes();
    const next = vi.fn();

    decodeToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ _id: "real-user", club: "TEST_TEAM" }, process.env.SECRET, {
      expiresIn: -1,
    });
    const req = { headers: { authorization: `Bearer ${expired}` } };
    const res = mockRes();
    const next = vi.fn();

    decodeToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("rejects a missing Authorization header", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();

    decodeToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "UNAUTHORIZED" });
  });
});
