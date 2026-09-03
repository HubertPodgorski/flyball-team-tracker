import { expect, Page } from "@playwright/test";

export const signupAndLoginAsTrainer = async (
  page: Page,
  { email, name, teamCode }: { email: string; name: string; teamCode: string }
) => {
  const password = "password123";

  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "Repeat password", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "Club code", exact: true }).fill(teamCode);
  await page.getByRole("button", { name: "Signup" }).click();
  await page.waitForURL(/\/user-panel/);
};

export const login = async (page: Page, email: string) => {
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/\/user-panel/);
};

export const logout = async (page: Page) => {
  await page.getByRole("button", { name: "open drawer" }).click();
  await page.getByText("Logout").click();
  await page.waitForURL(/\/login/);
};

export const addDog = async (page: Page, dogName: string) => {
  await page.goto("/trainer-panel/dogs");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(dogName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(dogName)).toBeVisible();
};
