import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

// Tasks used to be driven by an app-root-mounted bridge (TasksContextBridge)
// instead of a page-level query like every other entity, so it never
// remounted (and never refetched) across a pure SPA navigation. login()
// already lands on a Tasks page with zero clicks (useLogin navigates to
// /user-panel, whose index route redirects client-side to /user-panel/tasks)
// - that alone reproduces the bug. The drawer click below re-exercises the
// same no-reload mechanism a second time, landing on trainer-panel's tasks.
test("tasks actually load after a pure SPA login, reached via nav link (no page reload)", async ({
  page,
}) => {
  const email = uniqueEmail("fresh-login-tasks");
  await signupAndLoginAsTrainer(page, { email, name: "Fresh Login", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.getByRole("button", { name: "open drawer" }).click();
  await page.locator(".MuiDrawer-paper").getByRole("link", { name: "Tasks", exact: true }).click();
  await expect(page).toHaveURL(/\/trainer-panel\/tasks$/);

  const addButtons = page.getByText("Add task here");
  await expect(addButtons.first()).toBeVisible();
  const count = await addButtons.count();
  await addButtons.nth(count - 2).click();
  await page.getByRole("combobox", { name: "Type or select task description" }).fill("POST-LOGIN TASK");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText("POST-LOGIN TASK", { exact: true })).toBeVisible();
});
