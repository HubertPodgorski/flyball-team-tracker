import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// CurrentEventSelectWithDogs's whole point: pick an event to see which dogs
// are planned into tasks vs. actually marked present for it, and flag the
// mismatch (getDogPlanningColor) both in its own summary chips and on the
// task board's own dog chips.
test("selecting an event on the task board flags a dog planned but not marked present", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
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

  // The dog is planned into a task but never marked present for the event -
  // select the event and confirm both places flag it.
  await page.getByRole("combobox", { name: "Event" }).click();
  await page.getByRole("option", { name: eventName }).click();

  await expect(page.getByText("Planned, not present")).toBeVisible();

  const summaryChip = page.locator(".MuiChip-root", { hasText: dogName }).first();
  await expect(summaryChip).toHaveClass(/MuiChip-colorError/);

  const taskCard = page.locator("[data-task-id]", { hasText: description });
  const taskChip = taskCard.locator(".MuiChip-root", { hasText: dogName });
  await expect(taskChip).toHaveClass(/MuiChip-colorError/);
});
