import { test, expect } from "@playwright/test";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";

test("a trainer can add a dog and see it in the roster", async ({ page }) => {
  const email = uniqueEmail("trainer");
  const password = "password123";

  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Trainer User");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "Team code", exact: true }).fill("TEST");
  await page.getByRole("button", { name: "Signup" }).click();
  await page.waitForURL(/\/user-panel/);

  await promoteToTrainer(email);

  // Re-login so the returned user object (and its roles) reflects the promotion.
  await page.getByRole("button", { name: "open drawer" }).click();
  await page.getByText("Logout").click();
  await page.waitForURL(/\/login/);

  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/\/user-panel/);

  await page.goto("/trainer-panel/dogs");

  const dogName = `E2E Dog ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(dogName);
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText(dogName)).toBeVisible();
});
