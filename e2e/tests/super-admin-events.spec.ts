import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("super-admin can create, edit, and delete an event via the entity grid", async ({
  page,
}) => {
  const email = uniqueEmail("super-admin");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Super Admin", teamCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  await page.goto("/super-admin/events");

  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "TEST_TEAM", exact: true }).click();

  const eventName = `SA Event ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(eventName);
  await page.getByRole("combobox", { name: "Event type" }).click();
  await page.getByRole("option", { name: "Competition", exact: true }).click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(eventName)).toBeVisible();

  const createdRow = page.locator(".MuiDataGrid-row", { hasText: eventName });
  await expect(createdRow.getByText("COMPETITION", { exact: true })).toBeVisible();

  const row = page.locator(".MuiDataGrid-row", { hasText: eventName });

  await row.locator('[aria-label="Edit"]').click();
  // Checked before overwriting the name below - a test that only ever
  // fills over a field can't tell a correctly prefilled form from a blank
  // one (see CrossPassModal.tsx's real bug, caught only by checking this).
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(eventName);
  await expect(page.getByRole("combobox", { name: "Event type" })).toHaveText("Competition");
  const editedName = `${eventName} Edited`;
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(editedName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(editedName)).toBeVisible();

  const editedRow = page.locator(".MuiDataGrid-row", { hasText: editedName });

  await editedRow.locator('[aria-label="Delete"]').click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(editedName)).not.toBeVisible();
});
