import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";

// Regression test for a real production crash: react-sortablejs clones each
// child internally via React.cloneElement, which throws
// "Cannot read properties of null (reading 'props')" if a child is `null` -
// unlike React's own reconciliation, which tolerates `null` children fine.
// TeamDogsEditor/LineupDogsOrder kept a local `items` list synced to the
// `dogs` prop via a `useEffect` (which runs a tick after render/commit), so
// any render where a fresh SSE-driven `dogs` update landed before that effect
// caught up briefly produced a `null` entry - crashing the whole team card,
// on both directions (adding a dog, removing a dog). Fixed by never mapping
// an unmatched item to `null` (helpers/sortableDogs.ts's matchSortableDogs
// filters it out before any JSX is built), plus remounting the sortable
// outright when the *set* of dog ids changes. Only a real browser + the real
// react-sortablejs library reproduces this timing, so this needs to live
// here rather than as a unit test.
test("adding then removing a dog from a team's pool does not crash the UI", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

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

  // Seed a dog to move in and out of the team's pool.
  await page.goto("/trainer-panel/dogs");

  const dogName = `E2E Dog ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(dogName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(dogName)).toBeVisible();

  await page.goto("/trainer-panel/teams");

  const teamName = `E2E Team ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Team name", exact: true }).fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(teamName)).toBeVisible();

  await page.getByText(teamName).click();

  // Add the dog to the pool - one of the two reported crash directions.
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await expect(page.getByText(`1. ${dogName}`)).toBeVisible();

  // Remove it again - the other reported crash direction. Scoped to this
  // team's own card: this club accumulates other tests' teams/lineups in the
  // shared e2e DB, each with their own DeleteIcon still in the DOM (MUI's
  // Accordion doesn't unmount collapsed content), so an unscoped lookup is
  // ambiguous once enough of them exist.
  const teamCard = page.locator(".MuiCard-root", { hasText: teamName });
  await teamCard.getByTestId("DeleteIcon").click();
  await expect(page.getByText(`1. ${dogName}`)).not.toBeVisible();

  // The UI must still be alive - a crashed card would have unmounted this
  // along with everything else on the page.
  await expect(page.getByText(teamName)).toBeVisible();

  expect(pageErrors).toEqual([]);
});
