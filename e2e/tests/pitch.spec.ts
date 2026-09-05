import { test, expect } from "../helpers/fixtures";

test("the public pitch page shows the workflow steps, switches language, and links to login/signup", async ({
  page,
}) => {
  await page.goto("/pitch");

  await expect(page.getByRole("heading", { name: "Flyball Team Tracker" })).toBeVisible();
  await expect(page.getByText("How it works")).toBeVisible();

  // All 5 numbered workflow steps, in order.
  const steps = [
    "Add your dogs to the club",
    "Build teams and lineups",
    "Add tasks",
    "At training, set cross-pass times",
    "Everyone sees it live",
  ];

  for (const step of steps) {
    await expect(page.getByText(step, { exact: true })).toBeVisible();
  }

  // Language toggle re-renders the same content in Polish, in place.
  await page.getByRole("button", { name: "PL" }).click();
  await expect(page.getByText("Jak to działa")).toBeVisible();
  await expect(page.getByText("Dodaj swoje psy do klubu", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "EN" }).click();
  await expect(page.getByText("How it works")).toBeVisible();

  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/pitch");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/signup$/);
});
