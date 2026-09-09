import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer, seedTeamWithLineup, seedLineupLinkedTask } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// A dog chip's own edit rights: a trainer or the dog's own owner gets an editable field; anyone else, read-only.
test("a dog's details are editable for a trainer, read-only for another club member", async ({ page }) => {
  const trainerEmail = uniqueEmail("trainer");
  const memberEmail = uniqueEmail("member");

  await signupAndLoginAsTrainer(page, { email: trainerEmail, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(trainerEmail);
  await logout(page);
  await login(page, trainerEmail);

  const dogName = `Detail Dog ${Date.now()}`;
  await addDog(page, dogName);

  const description = `Dog details task ${Date.now()}`;

  await page.goto("/trainer-panel/tasks");
  await page.getByText("Add task here").first().click();
  await page.getByRole("combobox", { name: "Type or select task description" }).fill(description);
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();
  // .first() - the trainer page's always-mounted (but hidden) print view carries a second, off-screen copy.
  await expect(page.getByText(description, { exact: true }).first()).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  await page.getByRole("button", { name: dogName, exact: true }).first().click();

  const modal = page.locator(".MuiDialog-container", { hasText: dogName });

  await expect(modal.getByPlaceholder("Add notes...")).toBeVisible();
  await expect(modal.getByRole("button", { name: "Add cross pass" })).toBeVisible();
  await modal.getByRole("button", { name: "Close" }).click();
  await expect(modal).toBeHidden();

  // A second, unrelated club member (no roles, doesn't own this dog) sees the exact same dog read-only.
  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Member");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(memberEmail);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
  await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill("password123");
  await page.getByRole("textbox", { name: "Club code", exact: true }).fill("TEST");
  await page.getByRole("button", { name: "Signup" }).click();
  await page.waitForURL(/\/user-panel/);

  await page.goto("/user-panel/tasks");
  await page.getByRole("button", { name: dogName, exact: true }).first().click();

  const readOnlyModal = page.locator(".MuiDialog-container", { hasText: dogName });

  await expect(readOnlyModal.getByPlaceholder("Add notes...")).toHaveCount(0);
  await expect(readOnlyModal.getByRole("button", { name: "Add cross pass" })).toHaveCount(0);
  await expect(readOnlyModal.getByText("No notes yet")).toBeVisible();
});

// A linked task's own dogs open dog details now, never the lineup - only tapping the task itself still does that.
test("on a lineup-linked task, only the task itself opens the lineup - a dog on it opens dog details instead", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Lineup Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const { teamId, lineupId, lineupName, dogAName, dogs } = await seedTeamWithLineup("TEST_TEAM");
  const description = `Linked task ${Date.now()}`;

  await seedLineupLinkedTask("TEST_TEAM", teamId, lineupId, description, dogs);

  await page.goto("/user-panel/tasks");

  await page.getByRole("button", { name: dogAName, exact: true }).click();

  await expect(page.getByRole("heading", { name: lineupName })).toHaveCount(0);
  await expect(page.locator(".MuiDialog-container", { hasText: dogAName })).toBeVisible();

  await page.keyboard.press("Escape");

  await page.getByText(description, { exact: true }).click();

  await expect(page.getByRole("heading", { name: lineupName })).toBeVisible();
});
