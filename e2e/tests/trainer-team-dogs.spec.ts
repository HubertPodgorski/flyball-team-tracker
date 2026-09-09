import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";

// A team's own dog pool is unordered - adding/removing is a plain chip toggle now, not a drag-sortable list.
test("adding then removing a dog from a team's pool toggles it via its chip", async ({ page }) => {
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

  // This club accumulates other tests' teams with their own same-named dog chips, so scope every lookup to this team's own card.
  const teamCard = page.locator(".MuiCard-root", { hasText: teamName });
  const dogChip = teamCard.getByRole("button", { name: dogName, exact: true });

  await dogChip.click();
  await expect(teamCard.locator(".MuiChip-filled", { hasText: dogName })).toBeVisible();

  await dogChip.click();
  await expect(teamCard.locator(".MuiChip-filled", { hasText: dogName })).not.toBeVisible();

  // The UI must still be alive - a crashed card would have unmounted this along with everything else on the page.
  await expect(page.getByText(teamName)).toBeVisible();

  expect(pageErrors).toEqual([]);
});
