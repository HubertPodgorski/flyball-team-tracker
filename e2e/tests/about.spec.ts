import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("About page shows the general sections to everyone, and an extra section to trainers", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });

  await page.goto("/user-panel/about");
  await expect(page.getByRole("heading", { name: "About & how to use" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tasks", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Teams", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  // Not a trainer yet - the trainer-only section shouldn't render.
  await expect(page.getByRole("heading", { name: "Trainer tools" })).not.toBeVisible();

  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/user-panel/about");
  await expect(page.getByRole("heading", { name: "Trainer tools" })).toBeVisible();
});
