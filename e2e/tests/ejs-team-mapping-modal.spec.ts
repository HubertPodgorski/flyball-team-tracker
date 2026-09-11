import path from "path";
import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

const FIXTURE = path.join(__dirname, "..", "..", "api", "src", "controllers", "fixtures", "ejs-sample.xls");

// A trainer's mapping modal has no club field - only a super-admin can pick an arbitrary club (see ejs-import-wizard.spec.ts
// for that path, which also covers the regression where selecting a team name used to close the whole dialog).
test("a trainer's team-mapping modal has no club field and cancels cleanly", async ({ page }) => {
  const email = uniqueEmail("user");
  await signupAndLoginAsTrainer(page, { email, name: "E2E Mapping User", clubCode: "TEST" });

  await page.goto("/user-panel/ejs-stats");
  await page.getByRole("button", { name: "Choose club's teams" }).click();

  const dialog = page.getByRole("dialog").filter({ hasText: "Choose club's EJS teams" });
  await expect(dialog.getByRole("combobox", { name: "Club" })).toHaveCount(0);
  await expect(dialog.getByRole("combobox", { name: "Team names" })).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

// SANDBOX is a real signup club code untouched by every other EJS spec, so its "owns nothing yet" state is reliable
// regardless of what other clubs (TEST_TEAM, etc.) have already claimed in this run's shared database.
test("a club with no mapped teams gets the mapping modal automatically, and can claim a team from it", async ({ page }) => {
  const adminEmail = uniqueEmail("super-admin");
  await signupAndLoginAsTrainer(page, { email: adminEmail, name: "E2E Auto-open Admin", clubCode: "TEST" });
  await promoteToSuperAdmin(adminEmail);
  await logout(page);
  await login(page, adminEmail);

  // Seed some pool data for the auto-opened modal to offer.
  await page.goto("/user-panel/ejs-stats");
  await page.getByRole("button", { name: "Import EJS data" }).click();

  const importDialog = page.getByRole("dialog").filter({ hasText: "Import EJS data" });
  const competitionName = `E2E Auto-open Comp ${Date.now()}`;
  await importDialog.getByRole("button", { name: "Create competition" }).click();

  const eventForm = page.getByRole("dialog").filter({ hasText: "Adding an event" });
  await eventForm.getByRole("textbox", { name: "Name", exact: true }).fill(competitionName);
  await eventForm.getByRole("button", { name: "Submit" }).click();
  await importDialog.getByRole("button", { name: "Next" }).click();

  await importDialog.locator('input[type="file"]').setInputFiles(FIXTURE);
  await importDialog.getByRole("button", { name: "Analyze files" }).click();
  await expect(importDialog.getByText(/Found \d+ rows/)).toBeVisible();
  await importDialog.getByRole("button", { name: "Next" }).click();
  await importDialog.getByRole("button", { name: "Start import" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await logout(page);

  // A brand-new SANDBOX club has never claimed anything - the mapping modal should open on its own, unprompted.
  const trainerEmail = uniqueEmail("sandbox-user");
  await signupAndLoginAsTrainer(page, { email: trainerEmail, name: "E2E Sandbox User", clubCode: "SANDBOX" });
  await page.goto("/user-panel/ejs-stats");

  const mappingDialog = page.getByRole("dialog").filter({ hasText: "Choose club's EJS teams" });
  await expect(mappingDialog).toBeVisible();
  await expect(mappingDialog.getByRole("combobox", { name: "Club" })).toHaveCount(0);

  // Team B, not A - the wizard spec claims A for TEST_TEAM in this same run, which would show as taken here.
  await mappingDialog.getByRole("combobox", { name: "Team names" }).click();
  await page.getByRole("option", { name: "Fixture Team B", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(mappingDialog).toBeVisible();
  await mappingDialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Claimed - reloading no longer auto-opens it, and "My club" now shows Fixture Team B's own dogs.
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "All dogs", exact: true }).click();
  await expect(page.getByText("Spot").first()).toBeVisible();
});
