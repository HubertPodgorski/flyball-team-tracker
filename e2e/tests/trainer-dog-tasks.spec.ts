import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("trainer can create, edit, and delete a dog task", async ({ page }) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/dog-tasks");

  const taskName = `E2E DogTask ${Date.now()}`;
  const editedTaskName = `${taskName} Edited`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Task name", exact: true }).fill(taskName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(taskName, { exact: true })).toBeVisible();

  await page.getByText(taskName, { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Editing dog task" })).toBeVisible();
  // Checked before overwriting it below - a test that only ever fills over
  // a field can't tell a correctly prefilled form from a blank one (see
  // CrossPassModal.tsx's real bug, caught only by checking this).
  await expect(page.getByRole("textbox", { name: "Task name", exact: true })).toHaveValue(
    taskName
  );
  await page.getByRole("textbox", { name: "Task name", exact: true }).fill(editedTaskName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(editedTaskName, { exact: true })).toBeVisible();

  const taskCard = page.locator(".MuiCard-root", { hasText: editedTaskName });
  await taskCard.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(editedTaskName, { exact: true })).not.toBeVisible();
});
