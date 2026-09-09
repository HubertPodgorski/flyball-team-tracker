import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

// Calendar.jsx's own contribution beyond EventCard/EventDetails: the Upcoming tab (default) sorts soonest-first.
test("the Upcoming tab lists events soonest-first", async ({ page }) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const soonerEvent = `Sooner Event ${suffix}`;
  const laterEvent = `Later Event ${suffix}`;
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem("user") || "{}").token);

  // Two distinct times on today's own date - "upcoming" only cares about the calendar day, not the exact clock time.
  const todayIso = new Date().toISOString().slice(0, 10);
  const postEvent = (name: string, time: string) =>
    page.request.post("http://localhost:4101/events", {
      headers: { Authorization: `Bearer ${token}` },
      data: { name, date: `${todayIso}T${time}:00.000Z`, type: "TRAINING" },
    });

  await postEvent(soonerEvent, "01:00");
  await postEvent(laterEvent, "23:00");

  await page.goto("/user-panel/calendar");

  // allTextContents() has no auto-wait - without this, it can read the DOM
  // before the events query has finished loading and see nothing at all.
  await expect(page.getByText(laterEvent)).toBeVisible();

  const allHeadings = await page.getByRole("heading", { level: 5 }).allTextContents();
  const soonerIndex = allHeadings.indexOf(soonerEvent);
  const laterIndex = allHeadings.indexOf(laterEvent);

  expect(soonerIndex).toBeGreaterThan(-1);
  expect(laterIndex).toBeGreaterThan(-1);
  expect(soonerIndex).toBeLessThan(laterIndex);
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

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
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

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
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

// Past-dated events never mix into the Upcoming tab's own list/pagination - they land on the separate Past tab.
test("past events land on the Past tab, sorted newest-first, and paginate once there are more than 10", async ({
  page,
}) => {
  test.slow();

  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem("user") || "{}").token);

  // 12 distinctly-dated past events, well clear of any other spec's own past-dated fixtures (e.g. 2000-01-01).
  const names: string[] = [];

  for (let i = 0; i < 12; i++) {
    const name = `Past Page Event ${suffix}-${i}`;

    names.push(name);
    await page.request.post("http://localhost:4101/events", {
      headers: { Authorization: `Bearer ${token}` },
      data: { name, date: `2021-01-${String(i + 1).padStart(2, "0")}T12:00:00.000Z`, type: "TRAINING" },
    });
  }

  await page.goto("/user-panel/calendar");
  await page.getByRole("tab", { name: "Past events" }).click();

  const newestName = names[names.length - 1];
  const oldestName = names[0];

  // Newest-first: the last-created (2021-01-12) event is on page 1, the first-created (2021-01-01) only on page 2.
  await expect(page.getByText(newestName)).toBeVisible();

  const calendarPage = page.getByTestId("calendar-page");
  const pageOneCount = await calendarPage.getByText(new RegExp(`Past Page Event ${suffix}-`)).count();

  expect(pageOneCount).toBe(10);
  await expect(page.getByText(oldestName)).not.toBeVisible();

  await page.getByRole("button", { name: "Go to page 2" }).click();
  await expect(page.getByText(oldestName)).toBeVisible();
});

// A real push notification click can't be simulated - this exercises the
// same landing behavior directly: Calendar.jsx reading ?eventId=.
test("a deep-linked upcoming eventId scrolls to and highlights that specific event", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/events");

  const decoyName = `E2E Deep Link Decoy ${Date.now()}`;
  const targetName = `E2E Deep Link Target ${Date.now()}`;

  // The decoy takes the default date so it (not the target) wins the
  // pinned "next event" slot - the target must land further down the tab.
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(decoyName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(decoyName)).toBeVisible();

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/events") && res.request().method() === "POST"
    ),
    (async () => {
      await page.getByRole("button", { name: "Add" }).click();
      await page.getByRole("textbox", { name: "Name", exact: true }).fill(targetName);
      await page.getByRole("gridcell", { name: "28", exact: true }).click();
      await page.getByRole("button", { name: "Submit" }).click();
    })(),
  ]);

  const { _id: eventId } = await response.json();

  await page.goto(`/user-panel/calendar?eventId=${eventId}`);

  const card = page.locator(`#event-${eventId}`);
  await expect(card).toBeVisible();
  await expect(card).toContainText(targetName);
  await expect(card).toHaveCSS("outline-style", "solid");
  await expect(card.getByText("Next event")).toHaveCount(0);

  // The attendance details section starts expanded too - a notification
  // click should land straight on attendance-marking, not one tap short of it.
  await expect(card.getByText("Hide details")).toBeVisible();
});

// Regression coverage for the tab-switch + page-jump effect together, on its own fresh multi-page state.
test("a deep-linked past event switches to the Past tab and is navigated to automatically", async ({ page }) => {
  test.slow();

  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem("user") || "{}").token);

  // 10 recent-past decoys fill the Past tab's page 1 (newest-first); the target's far-older date sorts it onto page 2.
  for (let i = 0; i < 10; i++) {
    await page.request.post("http://localhost:4101/events", {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: `Buried Decoy ${suffix}-${i}`, date: `2022-02-${String(i + 1).padStart(2, "0")}T12:00:00.000Z`, type: "TRAINING" },
    });
  }

  const targetName = `E2E Buried Target ${suffix}`;
  const created = await page.request.post("http://localhost:4101/events", {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: targetName, date: "1999-01-01T12:00:00.000Z", type: "TRAINING" },
  });
  const { _id: eventId } = await created.json();

  await page.goto(`/user-panel/calendar?eventId=${eventId}`);

  await expect(page.getByRole("tab", { name: "Past events", selected: true })).toBeVisible();

  const card = page.locator(`#event-${eventId}`);
  await expect(card).toBeVisible();
  await expect(card).toContainText(targetName);
});
