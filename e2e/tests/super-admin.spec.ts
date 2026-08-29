import { test, expect } from "@playwright/test";
import { uniqueEmail } from "../helpers/testData";
import { promoteToAdmin, promoteToSuperAdmin } from "../helpers/db";
import { addDog, login, logout, signupAndLoginAsAdmin } from "../helpers/auth";

test("a super-admin can switch teams, act as them, and stays out of their user lists", async ({
  page,
}) => {
  const teamAEmail = uniqueEmail("team-a-admin");
  const teamBEmail = uniqueEmail("team-b-admin");
  const superAdminEmail = uniqueEmail("super-admin");
  const superAdminName = "E2E Super Admin";

  const teamADog = `TeamA Dog ${Date.now()}`;
  const teamBDog = `TeamB Dog ${Date.now()}`;

  // Team A gets a dog of its own.
  await signupAndLoginAsAdmin(page, {
    email: teamAEmail,
    name: "E2E Team A Admin",
    teamCode: "TEST",
  });
  await promoteToAdmin(teamAEmail);
  await logout(page);
  await login(page, teamAEmail);
  await addDog(page, teamADog);
  await logout(page);

  // Team B gets a different dog.
  await signupAndLoginAsAdmin(page, {
    email: teamBEmail,
    name: "E2E Team B Admin",
    teamCode: "WEST_SIDE_DOGZ",
  });
  await promoteToAdmin(teamBEmail);
  await logout(page);
  await login(page, teamBEmail);
  await addDog(page, teamBDog);
  await logout(page);

  // Super-admin's home team is TEST_TEAM, but they should be able to act as
  // WEST_SIDE_DOGZ and see/manage its data instead.
  await signupAndLoginAsAdmin(page, {
    email: superAdminEmail,
    name: superAdminName,
    teamCode: "TEST",
  });
  await promoteToSuperAdmin(superAdminEmail);
  await logout(page);
  await login(page, superAdminEmail);

  await page.getByRole("button", { name: "open drawer" }).click();
  await page.getByText("Team switch", { exact: true }).click();
  await expect(page.getByText("Currently acting as TEST_TEAM")).toBeVisible();
  await page.getByText("WEST_SIDE_DOGZ", { exact: true }).click();

  await page.goto("/admin-panel/dogs");
  await expect(page.getByText(teamBDog)).toBeVisible();
  await expect(page.getByText(teamADog)).not.toBeVisible();

  // Super-admin must not show up in the team's own user list.
  await page.goto("/admin-panel/users");
  await expect(page.getByText(superAdminName)).not.toBeVisible();

  // Switching back to their home team flips the visible data again.
  await page.goto("/team-switch");
  await expect(page.getByText("Currently acting as WEST_SIDE_DOGZ")).toBeVisible();
  await page.getByText("TEST_TEAM", { exact: true }).click();

  await page.goto("/admin-panel/dogs");
  await expect(page.getByText(teamADog)).toBeVisible();
  await expect(page.getByText(teamBDog)).not.toBeVisible();
});
