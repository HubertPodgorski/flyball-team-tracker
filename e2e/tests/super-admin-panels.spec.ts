import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer, promoteToSuperAdmin } from "../helpers/db";
import { login, logout, signupAndLoginAsTrainer } from "../helpers/auth";

const addDogTask = async (page, taskName: string) => {
  await page.goto("/trainer-panel/dog-tasks");
  await page.getByRole("button", { name: "Add" }).click();
  await page
    .getByRole("textbox", { name: "Task name", exact: true })
    .fill(taskName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(taskName)).toBeVisible();
};

test("super-admin dog-tasks panel lists across teams, filters by team, and supports full CRUD", async ({
  page,
}) => {
  const teamAEmail = uniqueEmail("panel-team-a-trainer");
  const teamBEmail = uniqueEmail("panel-team-b-trainer");
  const superAdminEmail = uniqueEmail("panel-super-admin");

  const teamATaskName = `TeamA DogTask ${Date.now()}`;
  const teamBTaskName = `TeamB DogTask ${Date.now()}`;

  await signupAndLoginAsTrainer(page, {
    email: teamAEmail,
    name: "E2E Panel Team A Trainer",
    teamCode: "TEST",
  });
  await promoteToTrainer(teamAEmail);
  await logout(page);
  await login(page, teamAEmail);
  await addDogTask(page, teamATaskName);
  await logout(page);

  await signupAndLoginAsTrainer(page, {
    email: teamBEmail,
    name: "E2E Panel Team B Trainer",
    teamCode: "WEST_SIDE_DOGZ",
  });
  await promoteToTrainer(teamBEmail);
  await logout(page);
  await login(page, teamBEmail);
  await addDogTask(page, teamBTaskName);
  await logout(page);

  await signupAndLoginAsTrainer(page, {
    email: superAdminEmail,
    name: "E2E Panel Super Admin",
    teamCode: "TEST",
  });
  await promoteToSuperAdmin(superAdminEmail);
  await logout(page);
  await login(page, superAdminEmail);

  await page.goto("/super-admin/dog-tasks");

  // No team selected -> everything, with a Team column.
  await expect(page.getByText(teamATaskName)).toBeVisible();
  await expect(page.getByText(teamBTaskName)).toBeVisible();
  await expect(
    page.locator('.MuiDataGrid-columnHeader[data-field="team"]')
  ).toBeVisible();

  // Filter down to one team - the other team's row and the Team column
  // both disappear.
  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "TEST_TEAM", exact: true }).click();

  await expect(page.getByText(teamATaskName)).toBeVisible();
  await expect(page.getByText(teamBTaskName)).not.toBeVisible();
  await expect(
    page.locator('.MuiDataGrid-columnHeader[data-field="team"]')
  ).not.toBeVisible();

  // Create.
  const newTaskName = `Super Admin Created Task ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page
    .getByRole("textbox", { name: "Task name", exact: true })
    .fill(newTaskName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(newTaskName)).toBeVisible();

  // Update.
  const editedTaskName = `${newTaskName} Edited`;
  const newRow = page.locator(".MuiDataGrid-row", { hasText: newTaskName });

  await newRow.locator('[aria-label="Edit"]').click();
  await page
    .getByRole("textbox", { name: "Task name", exact: true })
    .fill(editedTaskName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(editedTaskName)).toBeVisible();

  // Delete.
  const editedRow = page.locator(".MuiDataGrid-row", {
    hasText: editedTaskName,
  });

  await editedRow.locator('[aria-label="Delete"]').click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(editedTaskName)).not.toBeVisible();
});
