import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";

test.describe("authentication", () => {
  test("signup creates an account and lands in the app", async ({ page }) => {
    const email = uniqueEmail("signup");

    await page.goto("/signup");

    await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Signup User");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill("password123");
    await page.getByRole("textbox", { name: "Club code", exact: true }).fill("TEST");

    await page.getByRole("button", { name: "Signup" }).click();

    await page.waitForURL(/\/user-panel/);
  });

  test("an existing user can log out and log back in", async ({ page }) => {
    const email = uniqueEmail("login");
    const password = "password123";

    await page.goto("/signup");
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Login User");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
    await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill(password);
    await page.getByRole("textbox", { name: "Club code", exact: true }).fill("TEST");
    await page.getByRole("button", { name: "Signup" }).click();
    await page.waitForURL(/\/user-panel/);

    await page.getByRole("button", { name: "open drawer" }).click();
    await page.getByText("Logout").click();
    await page.waitForURL(/\/login/);

    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
    await page.getByRole("button", { name: "Login" }).click();

    await page.waitForURL(/\/user-panel/);
  });

  test("signing up with an already-registered email shows an error and does not navigate away", async ({
    page,
  }) => {
    const email = uniqueEmail("duplicate");
    const password = "password123";

    const fillSignupForm = async (name: string) => {
      await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
      await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
      await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
      await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill(password);
      await page.getByRole("textbox", { name: "Club code", exact: true }).fill("TEST");
    };

    await page.goto("/signup");
    await fillSignupForm("E2E Duplicate First");
    await page.getByRole("button", { name: "Signup" }).click();
    await page.waitForURL(/\/user-panel/);

    await page.getByRole("button", { name: "open drawer" }).click();
    await page.getByText("Logout").click();
    await page.waitForURL(/\/login/);

    await page.goto("/signup");
    await fillSignupForm("E2E Duplicate Second");
    await page.getByRole("button", { name: "Signup" }).click();

    await expect(
      page.getByText("An account with that email already exists.")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("logging in with the wrong password shows an error and does not navigate away", async ({
    page,
  }) => {
    const email = uniqueEmail("wrong-password");
    const password = "password123";

    await page.goto("/signup");
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Wrong Password");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
    await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill(password);
    await page.getByRole("textbox", { name: "Club code", exact: true }).fill("TEST");
    await page.getByRole("button", { name: "Signup" }).click();
    await page.waitForURL(/\/user-panel/);

    await page.getByRole("button", { name: "open drawer" }).click();
    await page.getByText("Logout").click();
    await page.waitForURL(/\/login/);

    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("wrong-password-here");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Incorrect password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("signing up with an unrecognized club code is blocked client-side before it ever reaches the server", async ({
    page,
  }) => {
    // SignupForm.jsx fetches the valid-codes list from GET /users/club-codes
    // (see userModel.js's getValidTeamCodes - the server's teamCodeMap is now
    // the single source of truth, no separate client-side list to drift out
    // of sync). Wait for that fetch before typing, or this assertion would
    // race it: the field's validator deliberately skips checking while the
    // list is still loading, rather than flash a false "invalid".
    const clubCodesResponse = page.waitForResponse((response) =>
      response.url().includes("/users/club-codes")
    );

    await page.goto("/signup");
    await clubCodesResponse;

    await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Bad Club Code");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(uniqueEmail("bad-club-code"));
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill("password123");
    await page.getByRole("textbox", { name: "Club code", exact: true }).fill("NOT_A_REAL_CODE");
    await expect(page.getByText("Invalid club invitation code")).toBeVisible();

    await page.getByRole("button", { name: "Signup" }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  // This client-side check and the server's own INVALID_CLUB_CODE rejection
  // both read from the same single source of truth now (see the test
  // above), so they can't drift apart the way two independent hardcoded
  // lists once could - but the server-side check still needs its own proof
  // against the API directly, bypassing the client validation entirely,
  // since nothing stops a request from skipping the client altogether.
  test("the API itself rejects an unrecognized club code, independent of client-side validation", async ({
    page,
  }) => {
    const email = uniqueEmail("api-bad-club-code");

    const response = await page.request.post("http://localhost:4101/users/signup", {
      data: {
        name: "E2E API Bad Club Code",
        email,
        password: "password123",
        teamCode: "NOT_A_REAL_CODE",
      },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "INVALID_CLUB_CODE" });

    // Confirm no orphaned account exists to log into.
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("No account found with that email.")).toBeVisible();
  });

  // Regression coverage for a real gap this session's own change introduced:
  // the club-code field's validator only skips checking while the list is
  // still *loading* - if the fetch fails outright, isLoading also settles to
  // false, so `!undefined?.includes(...)` would flag every code (even a
  // correct one) as invalid and block signup entirely, over what's meant to
  // be a non-blocking convenience check. Force that failure directly.
  test("signup still works even if the club-codes list fails to load", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.route("**/users/club-codes", (route) => route.abort());

    const email = uniqueEmail("club-codes-down");

    await page.goto("/signup");
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Codes Down");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill("password123");
    await page.getByRole("textbox", { name: "Club code", exact: true }).fill("TEST");

    // Give the query time to actually exhaust its retry and settle into its
    // failed state (clubCodesQueryOptions' retry:1) - checking too early
    // would still find it merely "loading", passing by luck regardless of
    // whether the failed-fetch case itself is handled correctly.
    await page.waitForTimeout(3000);

    await expect(page.getByText("Invalid club invitation code")).not.toBeVisible();

    await page.getByRole("button", { name: "Signup" }).click();
    await page.waitForURL(/\/user-panel/);

    // The exact regression: a validator throwing during submit (rather than
    // gracefully skipping) would have silently blocked the click above from
    // ever navigating, not necessarily surfaced any visible error text.
    expect(pageErrors).toEqual([]);
  });

  test("mismatched passwords on signup are flagged and block submission", async ({
    page,
  }) => {
    await page.goto("/signup");
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Mismatch");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(uniqueEmail("mismatch"));
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page
      .getByRole("textbox", { name: "Repeat password", exact: true })
      .fill("different456");
    await page.getByRole("textbox", { name: "Club code", exact: true }).fill("TEST");

    await expect(page.getByText("Passwords does not match")).toBeVisible();

    await page.getByRole("button", { name: "Signup" }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
