import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

test("a trainer can add a dog and see it in the roster", async ({ page }) => {
  const email = uniqueEmail("trainer");
  const password = "password123";

  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Trainer User");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "Club code", exact: true }).fill("TEST");
  await page.getByRole("button", { name: "Signup" }).click();
  await page.waitForURL(/\/user-panel/);

  await promoteToTrainer(email);

  // Re-login so the returned user object (and its roles) reflects the promotion.
  await page.getByRole("button", { name: "open drawer" }).click();
  await page.getByText("Logout").click();
  await page.waitForURL(/\/login/);

  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/\/user-panel/);

  await page.goto("/trainer-panel/dogs");

  const dogName = `E2E Dog ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(dogName);
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText(dogName)).toBeVisible();
});

test("leaving a dog's required name field empty shows a validation error", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  const password = "password123";

  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Trainer User");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "Club code", exact: true }).fill("TEST");
  await page.getByRole("button", { name: "Signup" }).click();
  await page.waitForURL(/\/user-panel/);

  await promoteToTrainer(email);

  await page.getByRole("button", { name: "open drawer" }).click();
  await page.getByText("Logout").click();
  await page.waitForURL(/\/login/);

  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/\/user-panel/);

  await page.goto("/trainer-panel/dogs");

  await page.getByRole("button", { name: "Add" }).click();
  // The validator runs onChange, not on blur/submit alone - type something
  // then use the field's own Clear button (ClearableTextField) to empty it,
  // rather than fill("") directly, so this also exercises that control.
  const nameField = page.getByRole("textbox", { name: "Name", exact: true });
  await nameField.fill("temp");
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(nameField).toHaveValue("");
  await expect(page.getByText("This field is required")).toBeVisible();

  await page.getByRole("button", { name: "Submit" }).click();
  // Still on the same open form - no dog got created from an empty name.
  await expect(page.getByRole("heading", { name: "Adding a dog" })).toBeVisible();
});

// Regression coverage for a real, session-wide gap: every create/update form
// used a fire-and-forget mutation with nothing disabling Submit while it was
// in flight, so a fast double-click could fire the request twice before the
// first one ever resolved. Now the button disables the instant the first
// click fires (see DogForm.jsx's isSubmitting/isPending check).
//
// A normal two-call `.click()` doesn't actually race this on a fast local
// server - by the time Playwright's own actionability checks let the second
// click through, the first request has already round-tripped and closed the
// modal, "passing" even with the fix reverted. Dispatching both clicks
// synchronously in one page.evaluate (bypassing Playwright's per-action
// overhead entirely) is what actually exercises the race.
test("double-clicking Submit on a new dog only creates it once", async ({ page }) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/dogs");

  const dogName = `E2E Double Submit Dog ${Date.now()}`;

  const createRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/dogs")) {
      createRequests.push(request.postData() ?? "");
    }
  });

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(dogName);

  await page
    .getByRole("button", { name: "Submit" })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });

  await expect(page.getByText(dogName)).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  expect(createRequests.length).toBe(1);
  await expect(page.getByText(dogName)).toHaveCount(1);
});

// Regression-shaped coverage: a test that only ever overwrites a field
// (fill, submit, check the new value stuck) can't tell a correctly
// prefilled form from a blank one - see CrossPassModal.tsx's real bug,
// found by checking the field's value immediately after reopening, before
// touching anything.
test("reopening a dog for edit prefills its existing values", async ({ page }) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/dogs");

  const dogName = `E2E Prefill Dog ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(dogName);
  await page.getByRole("spinbutton", { name: "Jump height" }).fill("30");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(dogName)).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  await page.getByText(dogName, { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Editing dog details" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(dogName);
  await expect(page.getByRole("spinbutton", { name: "Jump height" })).toHaveValue("30");
});
