import { test } from "@playwright/test";
import { uniqueEmail } from "../helpers/testData";

test.describe("authentication", () => {
  test("signup creates an account and lands in the app", async ({ page }) => {
    const email = uniqueEmail("signup");

    await page.goto("/signup");

    await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Signup User");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill("password123");
    await page.getByRole("textbox", { name: "Team code", exact: true }).fill("TEST");

    await page.getByRole("button", { name: "Signup" }).click();

    await page.waitForURL(/\/user-panel/);
  });

  test("an existing user can log out and log back in", async ({ page }) => {
    const email = uniqueEmail("login");
    const password = "password123";

    await page.goto("/signup");
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Login User");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
    await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill(password);
    await page.getByRole("textbox", { name: "Team code", exact: true }).fill("TEST");
    await page.getByRole("button", { name: "Signup" }).click();
    await page.waitForURL(/\/user-panel/);

    await page.getByRole("button", { name: "open drawer" }).click();
    await page.getByText("Logout").click();
    await page.waitForURL(/\/login/);

    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
    await page.getByRole("button", { name: "Login" }).click();

    await page.waitForURL(/\/user-panel/);
  });
});
