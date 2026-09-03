import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

test("trainer can build a team's lineup, add a cross-pass, then tear it down", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const dogAName = `Lead ${Date.now()}`;
  const dogBName = `Follow ${Date.now()}`;

  await addDog(page, dogAName);
  await addDog(page, dogBName);

  await page.goto("/trainer-panel/teams");

  const teamName = `E2E Lineup Team ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Team name", exact: true }).fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(teamName)).toBeVisible();

  await page.getByText(teamName).click();

  // Pool the two dogs.
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogAName }).click();
  await expect(page.getByText(`1. ${dogAName}`)).toBeVisible();

  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogBName }).click();
  await expect(page.getByText(`2. ${dogBName}`)).toBeVisible();

  // Build a lineup from both.
  await page.getByRole("button", { name: "Add lineup" }).click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Create" }).click();

  // Scoped to this team's own card throughout: other not-yet-deleted teams
  // elsewhere in this shared e2e DB keep their own headings/buttons in the
  // DOM too (MUI's Accordion/Collapse don't unmount collapsed content).
  const teamCard = page.locator(".MuiCard-root", { hasText: teamName });

  // Label includes the pool's jump height, e.g. "Lineup (35cm)" - match the
  // accordion heading itself rather than exact fallback text.
  const lineupHeading = teamCard.getByRole("heading", { level: 3 });
  await expect(lineupHeading).toContainText("Lineup");

  await lineupHeading.click();

  // Rename it.
  const newLineupName = `Named Lineup ${Date.now()}`;
  const lineupNameField = page.getByRole("textbox", { name: "Lineup name" });
  await lineupNameField.fill(newLineupName);
  await lineupNameField.blur();
  await expect(page.getByText(newLineupName)).toBeVisible();

  // Add a cross-pass between the two dogs. Both rows show "+ add" (the lead
  // dog's own "running on lights" row also lacks a cross-pass yet) - the
  // second occurrence is the follow dog's row, which has an actual predecessor.
  await page.getByText("+ add").nth(1).click();
  // type="number" -> role="spinbutton", not "textbox".
  await page.getByRole("spinbutton", { name: "Time" }).fill("3.2");
  await page.getByRole("textbox", { name: "Note", exact: true }).fill("Behind lead");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("3.2s")).toBeVisible();

  // Edit that same cross-pass - clicking the now-filled row reopens the
  // same modal, this time in edit mode (crossPass prop populated, so the
  // Time field comes back pre-filled with the earlier value, not blank -
  // that's the actual signal this landed in edit mode, not a fresh create).
  await page.getByText("3.2s").click();
  const timeField = page.getByRole("spinbutton", { name: "Time" });
  await expect(timeField).toHaveValue("3.2");
  await timeField.fill("4.1");
  await page.getByRole("textbox", { name: "Note", exact: true }).fill("Behind lead, later");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("4.1s")).toBeVisible();
  await expect(page.getByText("3.2s")).not.toBeVisible();

  // Delete just the cross-pass via the modal's own Delete button (edit mode
  // only) - distinct from deleting the whole lineup below.
  await page.getByText("4.1s").click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("4.1s")).not.toBeVisible();
  await expect(lineupHeading).toContainText("Lineup");

  // Delete the lineup - scope to its own Accordion so this doesn't hit one
  // of the team pool's per-dog delete icons instead.
  const lineupAccordion = teamCard.locator(".MuiAccordion-root", { has: lineupNameField });
  await lineupAccordion.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText(newLineupName)).not.toBeVisible();

  // Delete the whole team.
  await teamCard.getByRole("button", { name: "Delete team" }).click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(teamName)).not.toBeVisible();
});
