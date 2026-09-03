import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("super-admin can manage a club's teams directly", async ({ page }) => {
  // Late in a full-suite run, this club's accumulated teams/dogs make the
  // filtered grid and its round trips slower - the default 30s budget can
  // run out even though nothing is actually broken (see user-panel-tasks.spec.ts
  // and super-admin-users.spec.ts for the same pattern).
  test.slow();

  const email = uniqueEmail("super-admin");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Super Admin", teamCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  await page.goto("/super-admin/teams");

  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "TEST_TEAM", exact: true }).click();

  const teamName = `SA Team ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Team name", exact: true }).fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(teamName)).toBeVisible();

  await page.getByText(teamName).click();
  await page.getByRole("button", { name: "Delete team" }).click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(teamName)).not.toBeVisible();
});
