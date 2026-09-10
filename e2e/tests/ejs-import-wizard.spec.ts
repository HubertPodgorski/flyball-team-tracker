import path from "path";
import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

const FIXTURE = path.join(__dirname, "..", "..", "api", "src", "controllers", "fixtures", "ejs-sample.xls");

test("the EJS import wizard walks event -> files -> import", async ({ page }) => {
  const email = uniqueEmail("user");
  await signupAndLoginAsTrainer(page, { email, name: "E2E Import User", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/user-panel/ejs-stats");

  // Fresh account with no imports - only the import button, no competition picker.
  await expect(page.getByText("No EJS data imported yet", { exact: false })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Competition with imported data" })).toHaveCount(0);

  await page.getByRole("button", { name: "Import EJS data" }).click();

  const dialog = page.getByRole("dialog").filter({ hasText: "Import EJS data" });

  // Step 1 - create a fresh competition via the full event form.
  const competitionName = `E2E Wizard Comp ${Date.now()}`;
  await dialog.getByRole("button", { name: "Create competition" }).click();

  const eventForm = page.getByRole("dialog").filter({ hasText: "Adding an event" });
  await eventForm.getByRole("textbox", { name: "Name", exact: true }).fill(competitionName);
  await eventForm.getByRole("button", { name: "Submit" }).click();

  // Back in the wizard - the new competition is auto-selected.
  await expect(dialog.getByRole("combobox")).toContainText(competitionName);
  await dialog.getByRole("button", { name: "Next" }).click();

  // Step 2 - upload the sheet, mark our team, load rows.
  await dialog.locator('input[type="file"]').setInputFiles(FIXTURE);
  await dialog.getByRole("button", { name: "Analyze files" }).click();
  await dialog.getByText("Which of these teams are yours?").waitFor();
  await dialog.getByRole("button", { name: "Fixture Team A" }).click();
  await dialog.getByRole("button", { name: "Load matches" }).click();
  await expect(dialog.getByText(/Found \d+ rows for your teams/)).toBeVisible();
  await dialog.getByRole("button", { name: "Next" }).click();

  // Step 3 - import.
  await dialog.getByRole("button", { name: "Start import" }).click();
  await expect(page.getByText(/Imported \d+ entr/)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // The just-imported competition is auto-selected for viewing, and now appears in the (filtered) picker.
  await expect(page.getByRole("heading", { name: "Club stats" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Competition with imported data" })).toContainText(competitionName);

  // "All competitions together" aggregates across every import - the stats still render.
  await page.getByRole("button", { name: "All competitions together" }).click();
  await expect(page.getByRole("heading", { name: "Club stats" })).toBeVisible();

  // "All clubs" surfaces every club's rows from the sheet, ours included - both fixture teams are selectable.
  await page.getByRole("button", { name: "All clubs" }).click();
  await page.getByRole("button", { name: "Team", exact: true }).click();
  await page.getByRole("combobox", { name: "Team" }).click();
  await expect(page.getByRole("option", { name: "Fixture Team A" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Fixture Team B" })).toBeVisible();
  await page.keyboard.press("Escape");

  // "Whole clubs" tab aggregates every club into one row each, shown with the same stat cards.
  await page.getByRole("button", { name: "Whole clubs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Whole-club stats" })).toBeVisible();
  await expect(page.getByText("Fixture Team B").first()).toBeVisible();

  // Dog tab (still every club) - a picker, not chips, and each dog carries its club name.
  await page.getByRole("button", { name: "Dog", exact: true }).click();
  await page.getByRole("combobox", { name: "Dog" }).click();
  await expect(page.getByRole("option", { name: /\(Fixture Team B\)/ }).first()).toBeVisible();
});
