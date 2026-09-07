import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

test("trainer can create an event, cycle attendance, and delete it", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const email = uniqueEmail("trainer");
  const trainerName = `E2E Events Trainer ${Date.now()}`;

  await signupAndLoginAsTrainer(page, { email, name: trainerName, clubCode: "TEST" });
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

  // Changing the type while editing a real event must never rewrite its
  // already-real name - the type-prefill is for new events only.
  await page.getByRole("combobox", { name: "Event type" }).click();
  await page.getByRole("option", { name: "Meeting", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(eventName);
  await page.getByRole("combobox", { name: "Event type" }).click();
  await page.getByRole("option", { name: "Competition", exact: true }).click();

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

test("picking an event type prefills the name, but never overwrites one already typed", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Event Prefill Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/events");
  await page.getByRole("button", { name: "Add" }).click();

  const nameField = page.getByRole("textbox", { name: "Name", exact: true });

  await page.getByRole("combobox", { name: "Event type" }).click();
  await page.getByRole("option", { name: "Training", exact: true }).click();
  await expect(nameField).toHaveValue("Training");

  // Switching type again with no manual edit in between - the prefill follows.
  await page.getByRole("combobox", { name: "Event type" }).click();
  await page.getByRole("option", { name: "Seminary", exact: true }).click();
  await expect(nameField).toHaveValue("Seminary");

  // A custom name is never clobbered by a later type change.
  const customName = `Custom ${Date.now()}`;
  await nameField.fill(customName);
  await page.getByRole("combobox", { name: "Event type" }).click();
  await page.getByRole("option", { name: "Meeting", exact: true }).click();
  await expect(nameField).toHaveValue(customName);

  await page.getByRole("button", { name: "Cancel" }).click();
});

// Regression: cancelling an edit reset the name to blank without re-running
// the type-based prefill, since type's value itself hadn't changed.
test("re-opening Add right after cancelling an edit still prefills the name", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Reopen Prefill Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/events");

  const eventName = `E2E Reopen Prefill Event ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(eventName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(eventName)).toBeVisible();

  await page.getByText(eventName).click();
  await expect(page.getByRole("heading", { name: "Editing event" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: "Adding an event" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Training");

  await page.getByRole("button", { name: "Cancel" }).click();
});

// Regression: no editing involved at all here - a plain Add -> Cancel never
// changes initialData's reference, so the prop-watching effect never
// re-fires to repair the name that handleClose's own reset just blanked.
test("re-opening Add right after cancelling a fresh, untouched Add still prefills the name", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Plain Reopen Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/events");

  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Training");
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Training");

  await page.getByRole("button", { name: "Cancel" }).click();
});
