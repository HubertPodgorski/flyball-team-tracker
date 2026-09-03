import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// Every other test in this suite runs at desktop size. Several components
// branch on useIsMobile (TasksDragNDrop/DogsTaskCell/EventDetails Typography
// variants, TaskCell padding) - this is the only check that the app is even
// usable, not just visually different, at a mobile viewport.
test.use({ viewport: { width: 390, height: 844 } });

test("core flows remain usable at a mobile viewport", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Mobile Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const dogName = `Mobile Dog ${Date.now()}`;
  await addDog(page, dogName);

  await page.goto("/trainer-panel/tasks");

  const description = `Mobile task ${Date.now()}`;
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

  // Nav still works from the bottom tab bar/drawer at this size.
  await page.getByRole("button", { name: "open drawer" }).click();
  await page.getByRole("link", { name: "Dogs", exact: true }).click();
  await expect(page).toHaveURL(/\/trainer-panel\/dogs$/);
  await expect(page.getByText(dogName, { exact: true })).toBeVisible();

  expect(pageErrors).toEqual([]);
});
