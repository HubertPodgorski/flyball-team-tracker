import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

// Calendar.jsx's own contribution beyond EventCard/EventDetails (both
// exercised elsewhere): sortByNewest ordering of the event list itself.
test("calendar lists events newest-first", async ({ page }) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const olderEvent = `Older Event ${suffix}`;
  const newerEvent = `Newer Event ${suffix}`;

  await page.goto("/trainer-panel/events");

  const createEvent = async (name: string) => {
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText(name)).toBeVisible();
  };

  // Both default to "now" at their own creation moment - created in this
  // order, the second is naturally the later date.
  await createEvent(olderEvent);
  await createEvent(newerEvent);

  await page.goto("/user-panel/calendar");

  // allTextContents() has no auto-wait - without this, it can read the DOM
  // before the events query has finished loading and see nothing at all.
  await expect(page.getByText(newerEvent)).toBeVisible();

  const allHeadings = await page.getByRole("heading", { level: 5 }).allTextContents();
  const olderIndex = allHeadings.indexOf(olderEvent);
  const newerIndex = allHeadings.indexOf(newerEvent);

  expect(olderIndex).toBeGreaterThan(-1);
  expect(newerIndex).toBeGreaterThan(-1);
  expect(newerIndex).toBeLessThan(olderIndex);
});

// This club accumulates events across the whole shared e2e run (see other
// spec files), so which *specific* event ends up as "the" next upcoming one
// isn't something a single test can control or predict - some earlier
// test's own today-dated event may well outrank whichever one this test
// creates. What's actually testable, and true regardless of that: exactly
// one event is ever pinned at a time (the badge never appears twice), and
// the date-range filter is applied before the "next event" pick is made, so
// pushing every event out of range makes the badge disappear entirely too.
test("exactly one event is pinned as 'Next event', and the date-range filter is applied before it's picked", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const eventName = `E2E Pin Test Event ${Date.now()}`;

  await page.goto("/trainer-panel/events");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(eventName);
  // Leave the date at its default ("now") - always on/after start of today,
  // so at least one qualifying candidate is guaranteed to exist.
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(eventName)).toBeVisible();

  await page.goto("/user-panel/calendar");

  const eventCard = page.locator(".MuiCard-root", { hasText: eventName });
  await expect(eventCard).toBeVisible();

  const nextEventBadge = page.getByText("Next event");
  await expect(nextEventBadge).toBeVisible();
  await expect(nextEventBadge).toHaveCount(1);

  // Move the "From" filter a month ahead - every event in this club (this
  // one included) is dated today or earlier, so all of them fall outside
  // the range: the card disappears, and with nothing left to pick from,
  // so does the badge.
  const fromField = page.getByRole("group", { name: "From" });
  await fromField.getByRole("button", { name: "Choose date" }).click();
  await page.getByRole("button", { name: "Next month" }).click();
  await page.getByRole("gridcell", { name: "1", exact: true }).first().click();

  await expect(eventCard).not.toBeVisible();
  await expect(page.getByText("No events in this range")).toBeVisible();
  await expect(nextEventBadge).toHaveCount(0);

  // Clearing the filter brings everything back, badge included.
  await fromField.getByRole("button", { name: "Clear" }).click();

  await expect(eventCard).toBeVisible();
  await expect(nextEventBadge).toHaveCount(1);
});

// Regression coverage for a real bug: the "To" filter compared an event's
// exact date/time against midnight at the *start* of the picked day, so
// picking today hid every event scheduled later that same day - "To" needs
// to mean "through the end of this day", not "through this exact instant".
test("the 'To' date filter includes the whole picked day, not just up to its midnight", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const eventName = `E2E Inclusive To Event ${Date.now()}`;

  await page.goto("/trainer-panel/events");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(eventName);
  // Default date is "now" - today, at whatever time this test happens to
  // run, which is exactly the case the bug hid (a "To" of today excluded
  // anything after midnight, i.e. every real event ever created this way).
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(eventName)).toBeVisible();

  await page.goto("/user-panel/calendar");

  const eventCard = page.locator(".MuiCard-root", { hasText: eventName });
  await expect(eventCard).toBeVisible();

  const today = new Date();
  const typeDateInto = async (groupName: string, date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    const group = page.getByRole("group", { name: groupName });

    await group.getByRole("spinbutton", { name: "Month" }).click();
    await page.keyboard.type(`${mm}${dd}${yyyy}`);
  };

  // "To" = today must still include this event, scheduled today at
  // whatever time it happened to be created.
  await typeDateInto("To", today);
  await expect(eventCard).toBeVisible();

  // "To" = yesterday must exclude it - proving the filter is actually being
  // applied, not just permanently showing everything regardless.
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await typeDateInto("To", yesterday);
  await expect(eventCard).not.toBeVisible();
});

test("the calendar paginates once there are more than 10 regular events", async ({
  page,
}) => {
  // 12 full create-event round trips plus assertions is well past the
  // default per-test budget.
  test.slow();

  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();

  await page.goto("/trainer-panel/events");

  // 12 events: 1 becomes the pinned "next event", leaving 11 for the
  // paginated list - one page of 10 plus a second page of 1.
  for (let i = 0; i < 12; i++) {
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(`Page Event ${suffix}-${i}`);
    await page.getByRole("button", { name: "Submit" }).click();
    // Name and date render combined in one text node (see
    // event-date-picker.spec.ts) - not an exact match.
    await expect(page.getByText(`Page Event ${suffix}-${i}`)).toBeVisible();
  }

  await page.goto("/user-panel/calendar");

  await expect(page.getByText("Next event")).toBeVisible();
  // BottomNavBar.jsx also renders a <nav> - scope to MUI Pagination's own.
  await expect(page.getByRole("navigation", { name: "pagination navigation" })).toBeVisible();

  // At most one event club-wide is ever pinned as "next event" (the global
  // earliest upcoming one, whether or not it's one of these 12) - it stays
  // visible on both pages regardless, so counts are scoped to the paginated
  // grid itself (data-testid="calendar-page"), not the whole page. Page 1
  // is always exactly a full page of 10 regardless of which event got
  // pinned, and the rest (11 or 12, depending on whether the pinned one is
  // one of these) land on page 2 - not asserting an exact page-2 count,
  // since some other test's own today-dated event could be the one pinned.
  const calendarPage = page.getByTestId("calendar-page");

  const pageOneCount = await calendarPage
    .getByText(new RegExp(`Page Event ${suffix}-`))
    .count();
  expect(pageOneCount).toBe(10);

  await page.getByRole("button", { name: "Go to page 2" }).click();

  const pageTwoCount = await calendarPage
    .getByText(new RegExp(`Page Event ${suffix}-`))
    .count();
  expect(pageTwoCount).toBeGreaterThanOrEqual(1);
  expect(pageTwoCount).toBeLessThanOrEqual(2);
});
