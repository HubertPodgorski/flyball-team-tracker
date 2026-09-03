import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// pages/userPanel/Teams.tsx always passes editable={false} to TeamCard,
// regardless of role - a trainer viewing this page (as opposed to their own
// /trainer-panel/teams) still gets the read-only rendering. Never actually
// asserted against before, even though a nav test visited this exact page.
test("the read-only /user-panel/teams view hides every structural control", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const dogAName = `ReadOnly Lead ${suffix}`;
  const dogBName = `ReadOnly Follow ${suffix}`;

  await addDog(page, dogAName);
  await addDog(page, dogBName);

  await page.goto("/trainer-panel/teams");

  const teamName = `E2E ReadOnly Team ${suffix}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Team name", exact: true }).fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(teamName)).toBeVisible();

  await page.getByText(teamName).click();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogAName }).click();
  await expect(page.getByText(`1. ${dogAName}`)).toBeVisible();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogBName }).click();
  await expect(page.getByText(`2. ${dogBName}`)).toBeVisible();

  await page.getByRole("button", { name: "Add lineup" }).click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Create" }).click();

  const trainerTeamCard = page.locator(".MuiCard-root", { hasText: teamName });
  await expect(trainerTeamCard.getByRole("heading", { level: 3 })).toContainText("Lineup");

  // Now the read-only view of the exact same team.
  await page.goto("/user-panel/teams");

  const readOnlyCard = page.locator(".MuiCard-root", { hasText: teamName });
  await expect(readOnlyCard).toBeVisible();

  await readOnlyCard.getByText(teamName).click();

  // The dogs show as plain, non-interactive chips - no "Add dog" combobox,
  // no per-dog delete icon. Names legitimately repeat (pool chip, lineup
  // label, DogChain caption) - just confirm at least one instance each.
  await expect(readOnlyCard.getByText(dogAName).first()).toBeVisible();
  await expect(readOnlyCard.getByText(dogBName).first()).toBeVisible();
  await expect(readOnlyCard.getByRole("combobox", { name: "Add dog" })).toHaveCount(0);
  await expect(readOnlyCard.getByTestId("DeleteIcon")).toHaveCount(0);

  // No rename field, no "Add lineup"/"Delete team" buttons.
  await expect(readOnlyCard.getByRole("textbox", { name: "Team name" })).toHaveCount(0);
  await expect(readOnlyCard.getByRole("button", { name: "Add lineup" })).toHaveCount(0);
  await expect(readOnlyCard.getByRole("button", { name: "Delete team" })).toHaveCount(0);

  // The lineup itself is still viewable, and its cross-passes stay
  // interactive ("editable by any team member" per LineupAccordion) - only
  // the structure (roster, order, rename, delete) is trainer-only.
  const lineupHeading = readOnlyCard.getByRole("heading", { level: 3 });
  await expect(lineupHeading).toContainText("Lineup");
  await lineupHeading.click();
  await expect(readOnlyCard.getByRole("textbox", { name: "Lineup name" })).toHaveCount(0);
  await expect(readOnlyCard.getByText("+ add").first()).toBeVisible();
});
