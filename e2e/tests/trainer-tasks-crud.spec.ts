import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("trainer can create, edit, and delete a single task", async ({ page }) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/tasks");

  const suffix = Date.now();
  const description = `Turn drill ${suffix}`;
  const editedDescription = `Turn drill ${suffix} edited`;

  const addTaskButtons = page.getByText("Add task here");
  // .count() has no auto-wait - without this, it can race the initial tasks
  // fetch and return a stale/zero count, throwing the index below off.
  await expect(addTaskButtons.first()).toBeVisible();
  const count = await addTaskButtons.count();
  // Trailing empty row's first column is the second-to-last button.
  await addTaskButtons.nth(count - 2).click();
  await page
    .getByRole("combobox", { name: "Type or select task description" })
    .fill(description);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  // Edit - click the task card to reopen the form.
  await page.getByText(description, { exact: true }).click();
  const descriptionField = page.getByRole("combobox", {
    name: "Type or select task description",
  });
  await descriptionField.fill("");
  await descriptionField.fill(editedDescription);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(editedDescription, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  // Delete - the task card's own delete icon (top-right of the card).
  const taskCard = page.locator("[data-task-id]", { hasText: editedDescription });
  await taskCard.getByTestId("DeleteIcon").click();
  await expect(page.getByText(editedDescription, { exact: true })).not.toBeVisible();
});
