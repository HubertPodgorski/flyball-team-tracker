import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// The read-only /user-panel/tasks board (DogsTaskCell) is a different
// component from the trainer's editable board (TasksDragNDrop) - tapping a
// dog's name here opens a note editor for a plain task, or the lineup's
// cross-pass modal for a lineup-linked one (per About page's own description
// of this page).
test("user-panel tasks: tapping a dog opens its note, or the linked lineup's cross-passes", async ({
  page,
}) => {
  // Heaviest single test in the suite - two full task-creation flows plus a
  // team+lineup creation flow before the read-only board is even reached.
  // Late in a full-suite run, the shared club's accumulated tasks/teams also
  // make each of those GETs slower - the default 30s budget can run out
  // mid-navigation even though nothing is actually broken.
  test.slow();

  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const dogName = `UserPanel Dog ${suffix}`;
  const partnerDog = `UserPanel Partner ${suffix}`;

  await addDog(page, dogName);
  await addDog(page, partnerDog);

  // A plain task (no lineup link).
  await page.goto("/trainer-panel/tasks");

  const plainDescription = `Plain task ${suffix}`;
  const addTaskButtons = page.getByText("Add task here");
  await expect(addTaskButtons.first()).toBeVisible();
  const count = await addTaskButtons.count();
  await addTaskButtons.nth(count - 2).click();
  await page
    .getByRole("combobox", { name: "Type or select task description" })
    .fill(plainDescription);
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(plainDescription, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  // A lineup-linked task.
  await page.goto("/trainer-panel/teams");

  const teamName = `E2E UserPanel Team ${suffix}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Team name", exact: true }).fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(teamName)).toBeVisible();

  await page.getByText(teamName).click();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await expect(page.getByText(`1. ${dogName}`)).toBeVisible();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: partnerDog }).click();
  await expect(page.getByText(`2. ${partnerDog}`)).toBeVisible();

  await page.getByRole("button", { name: "Add lineup" }).click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Create" }).click();
  const teamCard = page.locator(".MuiCard-root", { hasText: teamName });
  await expect(teamCard.getByRole("heading", { level: 3 })).toContainText("Lineup");

  await page.goto("/trainer-panel/tasks");

  const linkedDescription = `Linked task ${suffix}`;
  const addTaskButtons2 = page.getByText("Add task here");
  await expect(addTaskButtons2.first()).toBeVisible();
  const count2 = await addTaskButtons2.count();
  await addTaskButtons2.nth(count2 - 2).click();
  await page
    .getByRole("combobox", { name: "Type or select task description" })
    .fill(linkedDescription);
  await page.getByRole("button", { name: "Team lineup" }).click();
  await page.getByRole("combobox", { name: "Team", exact: true }).click();
  await page.getByRole("option", { name: teamName }).click();
  await page.getByRole("combobox", { name: "Lineup", exact: true }).click();
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(linkedDescription, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  // Now the read-only board.
  await page.goto("/user-panel/tasks");

  const plainCard = page.locator(".MuiCard-root", { hasText: plainDescription });
  await expect(plainCard).toBeVisible();
  await plainCard.getByText(dogName, { exact: true }).click();

  const noteText = `Great turns ${suffix}`;
  await page.getByRole("textbox", { name: "Notes" }).fill(noteText);
  await page.getByRole("button", { name: "Save" }).click();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  // Reopen to confirm the note persisted.
  await plainCard.getByText(dogName, { exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Notes" })).toHaveValue(noteText);
  await page.getByRole("button", { name: "Cancel" }).click();

  const linkedCard = page.locator(".MuiCard-root", { hasText: linkedDescription });
  await expect(linkedCard).toBeVisible();
  await linkedCard.getByText(dogName, { exact: true }).click();

  // The lineup cross-pass modal, not a note editor - titled with the lineup
  // label and showing the team name + both lineup dogs.
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Lineup");
  await expect(page.getByText(teamName, { exact: true })).toBeVisible();
  // Appears multiple times inside the modal (chain caption, cross-pass rows) -
  // just confirm the lineup's own roster is shown, not a unique match.
  await expect(page.getByText(dogName, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(partnerDog, { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
});
