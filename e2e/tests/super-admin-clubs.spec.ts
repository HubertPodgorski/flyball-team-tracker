import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("super-admin can add a club code, suspend it, and delete it with the double confirm", async ({ page }) => {
  const email = uniqueEmail("clubs-super-admin");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Clubs Admin", clubCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  await page.goto("/super-admin/clubs");

  // The auto-seeded defaults are listed.
  await expect(page.getByText("TEST → TEST_TEAM")).toBeVisible();

  const suffix = Date.now();
  const code = `E2ECODE${suffix}`;

  await page.getByRole("textbox", { name: "Signup code" }).fill(code);
  await page.getByRole("textbox", { name: "Display name" }).fill(`E2E Club ${suffix}`);
  await page.getByRole("button", { name: "Add club", exact: true }).click();

  // team id defaults to the code for a new club.
  const row = page.locator(".MuiPaper-outlined").filter({ hasText: `${code} → ${code}` });
  await expect(row).toBeVisible();

  // Suspend it (controlled switch - one click, then wait for the refetch to reflect it).
  await row.getByRole("switch").click();
  await expect(row.getByRole("switch")).toBeChecked();

  // Delete: needs both the checkbox and the typed code.
  await row.getByRole("button", { name: "Delete club" }).click();

  const dialog = page.getByRole("dialog");
  const confirmButton = dialog.getByRole("button", { name: "Delete everything" });

  await expect(confirmButton).toBeDisabled();
  await dialog.getByRole("checkbox").check();
  await expect(confirmButton).toBeDisabled();
  await dialog.getByRole("textbox").fill(code);
  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();

  await expect(row).toHaveCount(0);
});
