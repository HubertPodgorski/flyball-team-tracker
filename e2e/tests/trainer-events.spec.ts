import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

test("trainer can create an event, cycle attendance, and delete it", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const email = uniqueEmail("trainer");
  const trainerName = `E2E Events Trainer ${Date.now()}`;

  await signupAndLoginAsTrainer(page, { email, name: trainerName, teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const dogName = `Event Dog ${Date.now()}`;
  await addDog(page, dogName);

  // Attendance can only be toggled for dogs assigned to this user - a newly
  // created dog isn't auto-assigned to its creator, so assign it first.
  await page.goto("/trainer-panel/users");
  await page.getByText(trainerName, { exact: true }).click();
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();

  // Confirm the assignment actually landed (fire-and-forget mutation, no
  // optimistic update - see SseHandler.tsx) before navigating away, otherwise
  // the reload below can win the race against the PATCH -> SSE -> localStorage
  // sync and the attendance button for this dog never renders.
  const trainerCard = page.locator(".MuiCard-root", { hasText: trainerName });
  await expect(trainerCard.getByText(dogName)).toBeVisible();

  await page.goto("/trainer-panel/events");

  // EventTypeLegend, always shown above the event list.
  await expect(page.getByText("Training", { exact: true })).toBeVisible();
  await expect(page.getByText("Competition", { exact: true })).toBeVisible();
  await expect(page.getByText("Seminary", { exact: true })).toBeVisible();
  await expect(page.getByText("Meeting", { exact: true })).toBeVisible();

  const eventName = `E2E Event ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(eventName);
  await page.getByRole("combobox", { name: "Event type" }).click();
  await page.getByRole("option", { name: "Competition", exact: true }).click();
  await page.getByRole("button", { name: "Submit" }).click();
  // The card's text combines name and date in one node ("Name: date"), so
  // this can't be an exact match.
  await expect(page.getByText(eventName)).toBeVisible();

  // Attendance is toggled from the calendar view's per-event details panel -
  // scoped to this event's own card, since every event accumulated in this
  // shared e2e DB shows its own "Show details" button on the same page.
  await page.goto("/user-panel/calendar");
  const calendarEventCard = page.locator(".MuiCard-root", { hasText: eventName });
  await calendarEventCard.getByText("Show details").click();

  const dogButton = calendarEventCard.getByRole("button", { name: dogName, exact: true });
  await expect(dogButton).toBeVisible();

  // Three-state cycle: default -> PRESENT -> ABSENT -> default. Just confirm
  // it can be clicked repeatedly without erroring - color-state assertions
  // belong at a lower level, this is the click-through happy path.
  await dogButton.click();
  await dogButton.click();
  await dogButton.click();
  await expect(dogButton).toBeVisible();

  // Same three-state cycle, but for the user's own attendance - a non-admin
  // only ever sees themselves as a selectable "user".
  const selfButton = calendarEventCard.getByRole("button", { name: trainerName, exact: true });
  await expect(selfButton).toBeVisible();
  await selfButton.click();
  await selfButton.click();
  await selfButton.click();
  await expect(selfButton).toBeVisible();

  await calendarEventCard.getByText("Hide details").click();

  // Edit the event - clicking its card (not the delete icon) reopens the
  // form pre-filled.
  await page.goto("/trainer-panel/events");

  const editedEventName = `${eventName} Edited`;

  await page.getByText(eventName).click();
  await expect(page.getByRole("heading", { name: "Editing event" })).toBeVisible();
  // Checked before overwriting the name below - a test that only ever fills
  // over a field can't tell a correctly prefilled form from a blank one
  // (see CrossPassModal.tsx's real bug, caught only by checking this).
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(eventName);
  await expect(page.getByRole("combobox", { name: "Event type" })).toHaveText("Competition");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(editedEventName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(editedEventName)).toBeVisible();
  await expect(page.getByText(eventName, { exact: true })).not.toBeVisible();

  // Delete the event from the admin list.
  const eventCard = page.locator(".MuiCard-root", { hasText: editedEventName });
  await eventCard.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(editedEventName)).not.toBeVisible();

  expect(pageErrors).toEqual([]);
});
