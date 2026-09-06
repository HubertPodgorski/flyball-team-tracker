import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";
import { Page } from "@playwright/test";

// Waits past useClubFeatures' optimistic all-on default, same as trainer-feature-flags.spec.ts.
const gotoFeaturesLoaded = async (page: Page) => {
  const loaded = page.waitForResponse(
    (res) => res.url().includes("/club-settings") && res.request().method() === "GET"
  );
  await page.goto("/trainer-panel/features");
  await loaded;
};

test("disabling Events / Calendar hides it from both the trainer drawer and the user tab bar", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Events Flag Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await gotoFeaturesLoaded(page);
  const eventsSwitch = page.getByRole("switch", { name: "Events / Calendar" });
  if (!(await eventsSwitch.isChecked())) await eventsSwitch.click();

  await page.getByRole("button", { name: "open drawer" }).click();
  await expect(page.locator(".MuiDrawer-paper").getByRole("link", { name: "Events", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  const bottomNav = page.locator(".MuiBottomNavigation-root");
  await expect(bottomNav.getByText("Calendar", { exact: true })).toBeVisible();

  await page.goto("/trainer-panel/tasks");
  await expect(page.getByRole("combobox", { name: "Event", exact: true })).toBeVisible();

  await gotoFeaturesLoaded(page);
  await eventsSwitch.click();

  await page.getByRole("button", { name: "open drawer" }).click();
  await expect(page.locator(".MuiDrawer-paper").getByRole("link", { name: "Events", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(bottomNav.getByText("Calendar", { exact: true })).toHaveCount(0);

  // Unrelated page, but it reads the same events data - leaks the feature if not gated too.
  // toHaveCount(0) resolves the instant it sees 0 matches, which a still-blank
  // page satisfies just as well as a correctly-hidden one - wait for the page
  // to have actually rendered first, via something always there regardless.
  await page.goto("/trainer-panel/tasks");
  await expect(page.getByText("Add task here").first()).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Event", exact: true })).toHaveCount(0);

  // No dependency here - independent of every other flag, unlike Teams &
  // Lineups/Cross-passes - so nothing else to check, just restore it.
  await gotoFeaturesLoaded(page);
  await page.getByRole("switch", { name: "Events / Calendar" }).click();
  await expect(bottomNav.getByText("Calendar", { exact: true })).toBeVisible();
});

test("disabling the Dog Tasks catalog hides its nav entry and empties the task description suggestions", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Dog Tasks Flag Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const catalogEntryName = `Catalog Suggestion ${Date.now()}`;
  await page.goto("/trainer-panel/dog-tasks");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Task name", exact: true }).fill(catalogEntryName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(catalogEntryName, { exact: true })).toBeVisible();

  await gotoFeaturesLoaded(page);
  const dogTasksSwitch = page.getByRole("switch", { name: "Dog Tasks catalog" });
  if (!(await dogTasksSwitch.isChecked())) await dogTasksSwitch.click();

  await page.getByRole("button", { name: "open drawer" }).click();
  await expect(page.locator(".MuiDrawer-paper").getByRole("link", { name: "Dog tasks", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  // Before: the catalog entry shows up as a suggestion when creating a task.
  await page.goto("/trainer-panel/tasks");
  const addButtons = page.getByText("Add task here");
  await addButtons.first().click();
  const descriptionField = page.getByRole("combobox", { name: "Type or select task description" });
  await descriptionField.click();
  await expect(page.getByRole("option", { name: catalogEntryName })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  await gotoFeaturesLoaded(page);
  await dogTasksSwitch.click();

  await page.getByRole("button", { name: "open drawer" }).click();
  await expect(page.locator(".MuiDrawer-paper").getByRole("link", { name: "Dog tasks", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");

  // After: same free-text field, but no catalog suggestions to pick from.
  await page.goto("/trainer-panel/tasks");
  await addButtons.first().click();
  await descriptionField.click();
  await expect(page.getByRole("option", { name: catalogEntryName })).toHaveCount(0);
  await descriptionField.fill("Still works as free text");
  await expect(descriptionField).toHaveValue("Still works as free text");

  await page.getByRole("button", { name: "Cancel" }).click();
  await gotoFeaturesLoaded(page);
  await dogTasksSwitch.click();
});

test("disabling Useful Resources hides its nav entry, without deleting existing resources", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Resources Flag Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const resourceName = `Flag Resource ${Date.now()}`;
  await page.goto("/user-panel/resources");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(resourceName);
  await page.getByRole("textbox", { name: "URL", exact: true }).fill("https://example.com");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(resourceName, { exact: true })).toBeVisible();

  await gotoFeaturesLoaded(page);
  const resourcesSwitch = page.getByRole("switch", { name: "Useful Resources" });
  if (!(await resourcesSwitch.isChecked())) await resourcesSwitch.click();

  await page.getByRole("button", { name: "open drawer" }).click();
  await expect(page.locator(".MuiDrawer-paper").getByRole("link", { name: "Resources", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await resourcesSwitch.click();

  await page.getByRole("button", { name: "open drawer" }).click();
  await expect(page.locator(".MuiDrawer-paper").getByRole("link", { name: "Resources", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");

  // Hidden from nav, but the data itself is untouched - navigating there
  // directly (no route guard exists for any feature flag) still shows it.
  await page.goto("/user-panel/resources");
  await expect(page.getByText(resourceName, { exact: true })).toBeVisible();

  await gotoFeaturesLoaded(page);
  await page.getByRole("switch", { name: "Useful Resources" }).click();
});
