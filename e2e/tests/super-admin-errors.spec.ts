import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin, seedAppError } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

test("a super-admin sees logged server errors, can expand a stack trace, and can clear them", async ({
  page,
}) => {
  const email = uniqueEmail("super-admin");

  await signupAndLoginAsTrainer(page, { email, name: "E2E SA", clubCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  const message = `Import blew up ${Date.now()}`;
  await seedAppError({ message });

  await page.goto("/super-admin/errors");

  const row = page.locator(".MuiAccordion-root", { hasText: message });
  await expect(row).toBeVisible();
  await expect(row.getByText("500", { exact: true })).toBeVisible();
  await expect(row.getByText("POST /competitions/x/ejs-confirm")).toBeVisible();

  // Stack trace is in the DOM but collapsed until the row is expanded.
  await expect(page.getByText("at somewhere (file.js:1:1)")).not.toBeVisible();
  await row.getByRole("button").click();
  await expect(page.getByText("at somewhere (file.js:1:1)")).toBeVisible();

  await page.getByRole("button", { name: "Clear all" }).click();
  await page.getByRole("button", { name: "Delete forever" }).click();

  await expect(page.getByText(message)).toHaveCount(0);
  await expect(page.getByText("No errors logged.")).toBeVisible();
});
