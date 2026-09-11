import path from "path";
import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

const FIXTURE = path.join(__dirname, "..", "..", "api", "src", "controllers", "fixtures", "ejs-sample.xls");

test("a super-admin imports an EJS file into the global pool, then a club claims its team", async ({ page }) => {
  const email = uniqueEmail("super-admin");
  await signupAndLoginAsTrainer(page, { email, name: "E2E EJS Admin", clubCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  await page.goto("/user-panel/ejs-stats");

  // Fresh pool - the import button is there (super-admin), no competition picker yet.
  await expect(page.getByText("No EJS data imported yet", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Import EJS data" }).click();

  const dialog = page.getByRole("dialog").filter({ hasText: "Import EJS data" });

  // Step 1 - create a fresh, club-less competition (just a name and dates - no club/type picker, it belongs to no club).
  const competitionName = `E2E Wizard Comp ${Date.now()}`;
  await dialog.getByRole("button", { name: "Create competition" }).click();

  const newEventDialog = page.getByRole("dialog").filter({ hasText: "New competition" });
  await newEventDialog.getByRole("textbox", { name: "Name", exact: true }).fill(competitionName);
  await newEventDialog.getByRole("button", { name: "Save" }).click();

  // Back in the wizard - the new competition is auto-selected.
  await expect(dialog.getByRole("combobox")).toContainText(competitionName);
  await dialog.getByRole("button", { name: "Next" }).click();

  // Step 2 - upload the sheet and analyze. No team-picking now; every team name found is just reported.
  await dialog.locator('input[type="file"]').setInputFiles(FIXTURE);
  await dialog.getByRole("button", { name: "Analyze files" }).click();
  await expect(dialog.getByText(/Found \d+ rows/)).toBeVisible();
  await expect(dialog.getByText("Fixture Team A", { exact: false })).toBeVisible();
  await dialog.getByRole("button", { name: "Next" }).click();

  // Step 3 - import.
  await dialog.getByRole("button", { name: "Start import" }).click();
  await expect(page.getByText(/Imported \d+ entr/)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // The just-imported competition is auto-selected and now in the shared picker.
  await expect(page.getByRole("combobox", { name: "Choose competition" })).toContainText(competitionName);

  // It has no calendar page of its own - a super-admin renames it right from here.
  const renamedCompetitionName = `${competitionName} (renamed)`;
  await page.getByRole("button", { name: "Edit competition" }).click();
  const editEventDialog = page.getByRole("dialog").filter({ hasText: "Edit competition" });
  await editEventDialog.getByRole("textbox", { name: "Name", exact: true }).fill(renamedCompetitionName);
  await editEventDialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Choose competition" })).toContainText(renamedCompetitionName);

  // Super-admin isn't auto-prompted (that's for a regular club) - they open the mapping modal explicitly and can
  // assign any club (a text field with suggestions, not just their own).
  await page.getByRole("button", { name: "Map teams to clubs" }).click();

  const mappingDialog = page.getByRole("dialog").filter({ hasText: "Choose club's EJS teams" });
  await mappingDialog.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "Test", exact: true }).click();
  await expect(mappingDialog.getByRole("combobox", { name: "Club" })).toHaveValue("Test");
  await mappingDialog.getByRole("combobox", { name: "Team names" }).click();
  await page.getByRole("option", { name: "Fixture Team A", exact: true }).click();
  await expect(mappingDialog.getByText("Fixture Team A", { exact: true })).toBeVisible();
  // Escape only dismisses the team-names dropdown, not the whole dialog (regression: it used to close everything).
  await page.keyboard.press("Escape");
  await expect(mappingDialog).toBeVisible();
  await mappingDialog.getByRole("button", { name: "Save" }).click();

  // Saved - the modal closes and "My club" stats now render Fixture Team A's own dogs for TEST_TEAM.
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Club stats" })).toBeVisible();
  await page.getByRole("button", { name: "All dogs", exact: true }).click();
  await expect(page.getByText("Rex").first()).toBeVisible();

  // "All clubs" still surfaces every team from the sheet, ours included.
  await page.getByRole("button", { name: "All clubs" }).click();
  await page.getByRole("button", { name: "Teams", exact: true }).click();
  await page.getByRole("combobox", { name: "Team" }).click();
  await expect(page.getByRole("option", { name: "Fixture Team A" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Fixture Team B" })).toBeVisible();
  await page.keyboard.press("Escape");

  // "My dogs" is a flat list of the current user's own dogs - this super-admin has none, so it says so.
  await page.getByRole("button", { name: "My dogs", exact: true }).click();
  await expect(page.getByText("None of your dogs appear in this competition yet.")).toBeVisible();
});
