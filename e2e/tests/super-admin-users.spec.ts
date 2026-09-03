import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("super-admin can reassign a user's club and roles via the entity grid", async ({
  page,
}) => {
  // Role/dog reassignment plus the password-reset round trip (which itself
  // needs three separate logins) adds up past the default 30s budget.
  test.slow();

  const superAdminEmail = uniqueEmail("super-admin");
  const memberEmail = uniqueEmail("member");
  const memberName = "E2E Grid Member";

  await signupAndLoginAsTrainer(page, {
    email: memberEmail,
    name: memberName,
    teamCode: "TEST",
  });
  await logout(page);

  await signupAndLoginAsTrainer(page, {
    email: superAdminEmail,
    name: "E2E Super Admin",
    teamCode: "TEST",
  });
  await promoteToSuperAdmin(superAdminEmail);
  await logout(page);
  await login(page, superAdminEmail);

  await page.goto("/super-admin/users");

  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "TEST_TEAM", exact: true }).click();

  const row = page.locator(".MuiDataGrid-row", { hasText: memberName });

  await row.locator('[aria-label="Edit"]').click();
  // Checked before changing roles below - a test that only ever adds a
  // role can't tell a correctly prefilled form from a blank one (see
  // CrossPassModal.tsx's real bug, caught only by checking this).
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(memberName);

  await page.getByRole("combobox", { name: "Roles" }).click();
  await page.getByRole("option", { name: "TRAINER", exact: true }).click();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Submit" }).click();

  await expect(
    page.locator(".MuiDataGrid-row", { hasText: memberName }).getByText("TRAINER")
  ).toBeVisible();

  // Assign a dog via the entity grid's own dogsOverride wiring (resolveFormExtraProps).
  const dogName = `SA Grid Dog ${Date.now()}`;

  await page.goto("/super-admin/dogs");
  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "TEST_TEAM", exact: true }).click();
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(dogName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(dogName)).toBeVisible();

  await page.goto("/super-admin/users");
  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "TEST_TEAM", exact: true }).click();

  await row.locator('[aria-label="Edit"]').click();
  // The TRAINER role assigned above must still show as prefilled here, not
  // just reflected in the grid row's own summary chip. Roles is a
  // multi-select (Autocomplete/Chip-based, like Dogs) - its selected values
  // render as adjacent chips, not as the combobox input's own text.
  await expect(page.getByRole("dialog").getByText("TRAINER", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(row.getByText(dogName)).toBeVisible();

  // Super-admin can reset the member's password across club boundaries -
  // the returned temporary password must actually work, and the member's
  // original one must stop working.
  await row.locator('[aria-label="Edit"]').click();
  await page.getByRole("button", { name: "Reset password" }).click();
  await page.getByRole("button", { name: "Remove" }).click();

  const temporaryPasswordField = page.getByRole("textbox", { name: "Password" });
  await expect(temporaryPasswordField).toBeVisible();
  const temporaryPassword = await temporaryPasswordField.inputValue();
  expect(temporaryPassword.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await logout(page);

  await page.getByRole("textbox", { name: "Email", exact: true }).fill(memberEmail);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("alert")).toBeVisible();

  await page.getByRole("textbox", { name: "Password", exact: true }).fill(temporaryPassword);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/\/user-panel/);
  await logout(page);

  await login(page, superAdminEmail);
  await page.goto("/super-admin/users");
  await page.getByRole("combobox", { name: "Club" }).click();
  await page.getByRole("option", { name: "TEST_TEAM", exact: true }).click();

  // Delete the user.
  await row.locator('[aria-label="Delete"]').click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(memberName, { exact: true })).not.toBeVisible();
});
