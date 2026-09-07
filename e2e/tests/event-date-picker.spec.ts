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

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
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

// Regression: submitting untouched used to save an unparseable date -
// StaticDateTimePicker needs a real Date, not Date.prototype.toString().
test("defaults an event's date to today at 17:30, without touching the picker", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/events");

  const eventName = `E2E Default Date Event ${Date.now()}`;
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(eventName);
  await page.getByRole("button", { name: "Submit" }).click();

  const eventCard = page.locator(".MuiCard-root", { hasText: eventName });
  await expect(eventCard).toBeVisible();
  await expect(eventCard.getByText(`${dd}/${mm}/${yyyy} 17:30`)).toBeVisible();
});

// Regression: date/time comes back as a plain string, which
// StaticDateTimePicker can't render selected - editing used to open blank.
test("editing an event pre-fills its actual saved date and time, not a blank picker", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/events");

  const eventName = `E2E Edit Prefill Event ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(eventName);
  await page.getByRole("gridcell", { name: "10", exact: true }).click();
  await page.getByRole("button", { name: "Submit" }).click();

  const eventCard = page.locator(".MuiCard-root", { hasText: eventName });
  await expect(eventCard).toBeVisible();
  await eventCard.click();

  const toolbar = page.locator(".MuiPickersToolbar-root").first();
  await expect(toolbar).toContainText("10");
  await expect(toolbar).toContainText("05");
  await expect(toolbar).toContainText("30");
  await expect(toolbar).toContainText("PM");
});

// The trainer's own Events page used to have no "next event" marker at all
// - only the member-facing Calendar page did.
test("marks the soonest upcoming event on the trainer's Events page", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/events");

  const soonName = `E2E Soon Event ${Date.now()}`;
  const laterName = `E2E Later Event ${Date.now()}`;

  // Both default to today at 17:30 - pick day 28 for the later one so it
  // sorts after (assumes the picker never opens on day 28-31 of the month).
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(laterName);
  await page.getByRole("gridcell", { name: "28", exact: true }).click();
  await page.getByRole("button", { name: "Submit" }).click();

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(soonName);
  await page.getByRole("button", { name: "Submit" }).click();

  const soonCard = page.locator(".MuiCard-root", { hasText: soonName });
  const laterCard = page.locator(".MuiCard-root", { hasText: laterName });

  await expect(soonCard.getByText("Next event")).toBeVisible();
  await expect(laterCard.getByText("Next event")).not.toBeVisible();
});
