import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { signupAndLoginAsTrainer } from "../helpers/auth";

const API_URL = "http://localhost:4101";

// Base64url-encode without the jsonwebtoken package - a hand-built JWT-shaped
// string (three dot-separated segments) is all this needs, since the whole
// point is that its signature is never actually checked against SECRET.
const base64url = (obj: object) =>
  Buffer.from(JSON.stringify(obj)).toString("base64url");

const forgeToken = (payload: object) =>
  `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(payload)}.not-a-real-signature`;

// Regression coverage for a real, severe vulnerability: decodeToken.js used
// to call jwt.decode() (parses the payload, checks nothing) instead of
// jwt.verify() (checks the signature against SECRET). A token hand-crafted
// with any secret at all - no knowledge of the server's real SECRET
// required - was trusted outright, letting anyone claim any club/_id and
// read or write that club's entire dataset through every route except
// /super-admin (which already verified correctly). This proves the fix
// against the real running server, not just the middleware in isolation.
test.describe("forged tokens are rejected by the real server, not just the middleware unit tests", () => {
  test("a token claiming an arbitrary club, with no valid signature, is rejected", async ({
    page,
  }) => {
    const forged = forgeToken({ _id: "attacker", club: "TEST_TEAM" });

    const response = await page.request.get(`${API_URL}/teams`, {
      headers: { Authorization: `Bearer ${forged}` },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "INVALID_TOKEN" });
  });

  test("a token signed with a different, made-up secret is rejected the same way", async ({
    page,
  }) => {
    // Same shape as a real token (three segments, plausible-looking
    // signature segment), just never actually produced by this server's
    // SECRET - exactly what an attacker with zero server access could craft.
    const forged = `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url({
      _id: "attacker",
      club: "TEST_TEAM",
    })}.${base64url({ fake: "signature" })}`;

    const response = await page.request.get(`${API_URL}/dogs`, {
      headers: { Authorization: `Bearer ${forged}` },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "INVALID_TOKEN" });
  });

  test("a request with no token at all is rejected, not silently scoped to no club", async ({
    page,
  }) => {
    const response = await page.request.get(`${API_URL}/teams`);

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "UNAUTHORIZED" });
  });

  test("the SSE stream endpoint rejects a forged token the same way, not just header-based routes", async ({
    page,
  }) => {
    // /stream can't use the decodeToken middleware (EventSource can't set
    // headers, so the token travels in the query string instead) and used to
    // verify it with the same unverified jwt.decode() call - missed when
    // decodeToken.js got the equivalent fix, letting anyone claiming any
    // club subscribe to that club's entire live broadcast feed.
    const forged = forgeToken({ club: "TEST_TEAM" });

    const response = await page.request.get(`${API_URL}/stream?token=${forged}`);

    expect(response.status()).toBe(401);
  });

  test("a real, legitimately-issued token still works end-to-end", async ({ page }) => {
    // The fix must not collaterally break real sessions - prove a genuine
    // login's token is still accepted by hitting a real page with it.
    await signupAndLoginAsTrainer(page, {
      email: uniqueEmail("real-token"),
      name: "E2E Real Token",
      teamCode: "TEST",
    });

    await page.goto("/user-panel/my-dogs");
    // A route guard redirect (wrong role, or a rejected token) would bounce
    // to /login instead of rendering this page.
    await expect(page).toHaveURL(/\/user-panel\/my-dogs$/);
  });

  test("a session whose token the server no longer accepts (e.g. a SECRET rotation) is bounced to login, not left silently broken", async ({
    page,
  }) => {
    await signupAndLoginAsTrainer(page, {
      email: uniqueEmail("secret-rotated"),
      name: "E2E Secret Rotated",
      teamCode: "TEST",
    });

    // Simulates exactly what rotating the server's SECRET does to every
    // already-issued token: still shaped like a real one, with a real
    // (non-expired) `exp`, so the client's own local expiry check in
    // AuthContext.tsx's getInitialUser doesn't reject it - but the
    // signature no longer verifies against the server's SECRET, so every
    // request now 401s. Swapping the token in localStorage (not the whole
    // signup/login flow) reproduces this without actually restarting the
    // API with a different SECRET.
    await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem("user")!);
      const base64url = (obj: object) =>
        btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      stored.token = `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url({
        _id: "whoever",
        club: "TEST_TEAM",
        exp: futureExp,
      })}.not-a-real-signature`;
      localStorage.setItem("user", JSON.stringify(stored));
    });

    // Before the fix: this just hung in a broken-looking state - every
    // load/save silently 401ing with no visible explanation, "logged in"
    // localStorage still sitting there.
    await page.goto("/user-panel/my-dogs");

    await expect(page).toHaveURL(/\/login$/);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("user")))
      .toBeNull();
  });
});
