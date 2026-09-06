import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("super-admin can create, edit, reassign, and delete a resource via the entity grid", async ({
  page,
}) => {
  const email = uniqueEmail("super-admin");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Super Admin", clubCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  await page.goto("/super-admin/resources");

  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "TEST_TEAM", exact: true }).click();

  const name = `SA Resource ${Date.now()}`;
  const url = "https://example.com/sa-resource";

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "URL", exact: true }).fill(url);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(name)).toBeVisible();

  const row = page.locator(".MuiDataGrid-row", { hasText: name });

  await row.locator('[aria-label="Edit"]').click();
  // Checked before overwriting the name below - a test that only ever fills
  // over a field can't tell a correctly prefilled form from a blank one.
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(name);
  await expect(page.getByRole("textbox", { name: "URL", exact: true })).toHaveValue(url);
  const editedName = `${name} Edited`;
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(editedName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(editedName)).toBeVisible();

  const editedRow = page.locator(".MuiDataGrid-row", { hasText: editedName });

  // Reassign to a different club - moves the row out of the current filter.
  await editedRow.locator('[aria-label="Edit"]').click();
  await page.getByRole("combobox", { name: "Team", exact: true }).click();
  await page.getByRole("option", { name: "WEST_SIDE_DOGZ", exact: true }).click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(editedName)).not.toBeVisible();

  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "WEST_SIDE_DOGZ", exact: true }).click();
  await expect(page.getByText(editedName)).toBeVisible();

  const reassignedRow = page.locator(".MuiDataGrid-row", { hasText: editedName });

  await reassignedRow.locator('[aria-label="Edit"]').click();
  await expect(page.getByRole("combobox", { name: "Team", exact: true })).toHaveText(
    "WEST_SIDE_DOGZ"
  );
  await page.getByRole("button", { name: "Cancel" }).click();

  await reassignedRow.locator('[aria-label="Delete"]').click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(editedName)).not.toBeVisible();
});
