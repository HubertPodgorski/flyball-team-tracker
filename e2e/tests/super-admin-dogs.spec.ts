import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("super-admin can create, edit, and delete a dog via the entity grid", async ({
  page,
}) => {
  const email = uniqueEmail("super-admin");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Super Admin", teamCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  await page.goto("/super-admin/dogs");

  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "TEST_TEAM", exact: true }).click();

  const dogName = `SA Dog ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(dogName);
  // type="number" -> role="spinbutton", not "textbox".
  await page.getByRole("spinbutton", { name: "Jump height" }).fill("30");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(dogName)).toBeVisible();

  const row = page.locator(".MuiDataGrid-row", { hasText: dogName });

  await row.locator('[aria-label="Edit"]').click();
  // Checked before overwriting the name below - a test that only ever
  // fills over a field can't tell a correctly prefilled form from a blank
  // one (see CrossPassModal.tsx's real bug, caught only by checking this).
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(dogName);
  await expect(page.getByRole("spinbutton", { name: "Jump height" })).toHaveValue("30");
  const editedName = `${dogName} Edited`;
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

  // Reopen once more - the just-reassigned team must show as prefilled,
  // not just reflected in which club filter the row now appears under.
  await reassignedRow.locator('[aria-label="Edit"]').click();
  await expect(page.getByRole("combobox", { name: "Team", exact: true })).toHaveText(
    "WEST_SIDE_DOGZ"
  );
  await page.getByRole("button", { name: "Cancel" }).click();

  await reassignedRow.locator('[aria-label="Delete"]').click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(editedName)).not.toBeVisible();
});

test("super-admin can sort the dogs grid by name", async ({ page }) => {
  const email = uniqueEmail("super-admin");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Super Admin", teamCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  await page.goto("/super-admin/dogs");
  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "TEST_TEAM", exact: true }).click();

  const suffix = Date.now();
  const firstName = `AAA Sort ${suffix}`;
  const secondName = `ZZZ Sort ${suffix}`;

  for (const name of [firstName, secondName]) {
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText(name)).toBeVisible();
  }

  const nameOf = async (rowIndex: number) =>
    page.locator(".MuiDataGrid-row").nth(rowIndex).locator(".MuiDataGrid-cell").first().textContent();

  await page.getByRole("columnheader", { name: "Name" }).click();
  await expect.poll(() => nameOf(0)).toBe(firstName);

  await page.getByRole("columnheader", { name: "Name" }).click();
  await expect.poll(() => nameOf(0)).toBe(secondName);
});
