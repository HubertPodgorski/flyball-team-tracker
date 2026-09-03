import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

// Every other event test leaves FormDatePicker's default ("now") untouched -
// this actually drives it, picking an explicit day.
test("trainer can pick a specific date for an event via the date picker", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/events");

  const eventName = `E2E Date Picker Event ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(eventName);

  // Pick day 10 of whatever month the picker opens to (openTo="day").
  await page.getByRole("gridcell", { name: "10", exact: true }).click();

  await page.getByRole("button", { name: "Submit" }).click();

  // Name and date render combined in one node ("Name: dd/MM/yyyy HH:mm").
  const eventCard = page.locator(".MuiCard-root", { hasText: eventName });
  await expect(eventCard).toBeVisible();
  await expect(eventCard.getByText(/10\//)).toBeVisible();
});
