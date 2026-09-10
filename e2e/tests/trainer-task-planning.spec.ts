import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer, deleteAllEvents, deleteAllTasks } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

const addEvent = async (page, name: string) => {
  await page.goto("/trainer-panel/events");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(name)).toBeVisible();
};

const selectEventOnBoard = async (page, name: string) => {
  await page.getByRole("combobox", { name: "Event" }).click();
  // Option label is "<name> <date>" (plus a "next event" marker), so match on the name as a substring.
  await page.getByRole("option", { name }).click();
};

// CurrentEventSelectWithDogs's whole point: pick an event to see which dogs
// are planned into tasks vs. actually marked present for it, and flag the
// mismatch (getDogPlanningColor) both in its own summary chips and on the
// task board's own dog chips.
test("selecting an event on the task board flags a dog planned but not marked present", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const dogName = `Planning Dog ${suffix}`;
  await addDog(page, dogName);

  await page.goto("/trainer-panel/events");

  const eventName = `E2E Planning Event ${suffix}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(eventName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(eventName)).toBeVisible();

  await page.goto("/trainer-panel/tasks");

  // Scope the board to this event first - a task created now belongs to that session's board.
  await page.getByRole("combobox", { name: "Event" }).click();
  await page.getByRole("option", { name: eventName }).click();

  const description = `Planning task ${suffix}`;
  const addTaskButtons = page.getByText("Add task here");
  await expect(addTaskButtons.first()).toBeVisible();
  const count = await addTaskButtons.count();
  await addTaskButtons.nth(count - 2).click();
  await page
    .getByRole("combobox", { name: "Type or select task description" })
    .fill(description);
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  // The dog is planned into a task but never marked present for the event - both places flag it.
  await expect(page.getByText("Planned, not present")).toBeVisible();

  const summaryChip = page.locator(".MuiChip-root", { hasText: dogName }).first();
  await expect(summaryChip).toHaveClass(/MuiChip-colorError/);

  const taskCard = page.locator("[data-task-id]", { hasText: description });
  const taskChip = taskCard.locator(".MuiChip-root", { hasText: dogName });
  await expect(taskChip).toHaveClass(/MuiChip-colorError/);

  // The task is scoped to this session - it's gone from the default board and back on the event's board.
  await page.getByRole("combobox", { name: "Event" }).click();
  await page.getByRole("option", { name: "None", exact: true }).click();
  await expect(page.getByText(description, { exact: true })).toHaveCount(0);

  await page.getByRole("combobox", { name: "Event" }).click();
  await page.getByRole("option", { name: eventName }).click();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
});

test("an empty session board can be seeded from a previously planned session", async ({ page }) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  // Only this spec's plans should exist, so "copy from previous" is deterministic.
  await deleteAllTasks("TEST_TEAM");
  await deleteAllEvents("TEST_TEAM");
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const dogName = `Copy Dog ${suffix}`;
  await addDog(page, dogName);

  const plannedEvent = `Copy Source ${suffix}`;
  const freshEvent = `Copy Target ${suffix}`;
  await addEvent(page, plannedEvent);
  await addEvent(page, freshEvent);

  await page.goto("/trainer-panel/tasks");

  // Plan the source session.
  await selectEventOnBoard(page, plannedEvent);
  const description = `Copied drill ${suffix}`;
  const addTaskButtons = page.getByText("Add task here");
  await expect(addTaskButtons.first()).toBeVisible();
  const count = await addTaskButtons.count();
  await addTaskButtons.nth(count - 2).click();
  await page.getByRole("combobox", { name: "Type or select task description" }).fill(description);
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  // Switch to the fresh session - empty, with the copy affordance offered.
  await selectEventOnBoard(page, freshEvent);
  await expect(page.getByText(description, { exact: true })).toHaveCount(0);

  const copyButton = page.getByRole("button", { name: "Copy plan from previous session" });
  await expect(copyButton).toBeVisible();
  await copyButton.click();

  await expect(page.getByText(description, { exact: true })).toBeVisible();
  // Board is no longer empty, so the affordance is gone.
  await expect(copyButton).toHaveCount(0);
});
