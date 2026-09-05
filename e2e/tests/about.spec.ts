import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("About page shows the general sections to everyone, and an extra section to trainers", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });

  await page.goto("/user-panel/about");
  await expect(page.getByRole("heading", { name: "About & how to use" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tasks", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Teams", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  // Not a trainer yet - the trainer-only sections shouldn't render.
  await expect(page.getByRole("heading", { name: "Trainer tools" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Getting started as a trainer" })).not.toBeVisible();

  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/user-panel/about");
  await expect(page.getByRole("heading", { name: "Trainer tools" })).toBeVisible();

  // The step-by-step guide - add dogs, then teams, then lineups, in order.
  await expect(page.getByRole("heading", { name: "Getting started as a trainer" })).toBeVisible();
  const steps = page.getByRole("heading", {
    name: /^(Add your dogs|Build a team|Build a lineup|Add tasks|Set cross-pass times)$/,
  });
  await expect(steps).toHaveCount(5);
  await expect(steps.nth(0)).toHaveText("Add your dogs");
  await expect(steps.nth(1)).toHaveText("Build a team");
  await expect(steps.nth(2)).toHaveText("Build a lineup");
});
