import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer, seedTeamWithLineup, seedLineupLinkedTask, deleteAllEvents } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// A dog chip opens dog details (and the note saved there persists) on this read-only board too, same as the trainer's.
test("user-panel tasks: tapping a dog opens its details, and a saved note persists", async ({ page }) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  // No events -> both the trainer board and the user board resolve to the default (no-event) board, where the seeded task lives.
  await deleteAllEvents("TEST_TEAM");
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const dogName = `UserPanel Dog ${suffix}`;

  await addDog(page, dogName);

  const plainDescription = `Plain task ${suffix}`;

  await page.goto("/trainer-panel/tasks");
  const addTaskButtons = page.getByText("Add task here");
  await expect(addTaskButtons.first()).toBeVisible();
  const count = await addTaskButtons.count();
  await addTaskButtons.nth(count - 2).click();
  await page.getByRole("combobox", { name: "Type or select task description" }).fill(plainDescription);
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(plainDescription, { exact: true }).first()).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  const { teamId, lineupId, lineupName, dogAName, dogs } = await seedTeamWithLineup("TEST_TEAM");
  const linkedDescription = `Linked task ${suffix}`;

  await seedLineupLinkedTask("TEST_TEAM", teamId, lineupId, linkedDescription, dogs);

  await page.goto("/user-panel/tasks");

  const plainCard = page.locator(".MuiCard-root", { hasText: plainDescription });

  await expect(plainCard).toBeVisible();
  await plainCard.getByRole("button", { name: dogName, exact: true }).click();

  const noteText = `Great turns ${suffix}`;

  await page.getByRole("textbox", { name: "Notes" }).fill(noteText);
  await page.getByRole("textbox", { name: "Notes" }).blur();
  await page.getByRole("button", { name: "Close" }).click();

  // Reopen to confirm the note actually saved, not just held in the field.
  await plainCard.getByRole("button", { name: dogName, exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Notes" })).toHaveValue(noteText);
  await page.getByRole("button", { name: "Close" }).click();

  const linkedCard = page.locator(".MuiCard-root", { hasText: linkedDescription });

  await expect(linkedCard).toBeVisible();
  await linkedCard.getByRole("button", { name: dogAName, exact: true }).click();

  // Dog details, not the lineup - the lineup's own heading is nowhere on screen.
  await expect(page.getByRole("heading", { name: lineupName })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Notes" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  // The task itself, though, still opens the lineup.
  await linkedCard.getByText(linkedDescription, { exact: true }).click();
  await expect(page.getByRole("heading", { name: lineupName })).toBeVisible();
});
