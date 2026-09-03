import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

test("user can switch the UI language and toggle a dog's cross-pass sync flags", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  const trainerName = `E2E Settings Trainer ${Date.now()}`;

  await signupAndLoginAsTrainer(page, { email, name: trainerName, teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const dogName = `Sync Dog ${Date.now()}`;
  await addDog(page, dogName);

  // Settings only shows sync toggles for dogs assigned to this user - a
  // newly created dog isn't auto-assigned to its creator, so assign it first.
  await page.goto("/trainer-panel/users");
  await page.getByText(trainerName, { exact: true }).click();
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();

  // Confirm the assignment actually landed (fire-and-forget mutation, no
  // optimistic update - see SseHandler.tsx) before navigating away, otherwise
  // the reload below can win the race against the PATCH -> SSE -> localStorage
  // sync and the sync-toggle section for this dog never renders.
  const trainerCard = page.locator(".MuiCard-root", { hasText: trainerName });
  await expect(trainerCard.getByText(dogName)).toBeVisible();

  await page.goto("/user-panel/settings");

  // Language toggle - switching to Polish must actually re-render the page's
  // own strings without a reload (the e2e fixture forces English back on any
  // navigation, so this only proves the in-session toggle, not persistence -
  // persistence of the `language` field itself is covered by the update-user
  // wiring already exercised elsewhere).
  await page.getByRole("combobox", { name: "Language" }).click();
  await page.getByRole("option", { name: "Polski" }).click();
  await expect(page.getByRole("heading", { name: "Ustawienia" })).toBeVisible();

  await page.locator(".MuiBottomNavigation-root").getByRole("link", { name: "Moje psy" }).click();
  await expect(page.getByText("Brak danych")).toBeVisible();
  await page.goBack();

  await page.getByRole("combobox", { name: "Język" }).click();
  await page.getByRole("option", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Cross-pass sync toggles for the owned dog - MUI's Switch exposes role
  // "switch", not "checkbox", and FormControlLabel gives each an accessible
  // name matching its own label text.
  const lineupsSyncSwitch = page.getByRole("switch", {
    name: "Sync between lineups (same predecessor → same timing)",
  });
  const myDogsSyncSwitch = page.getByRole("switch", {
    name: "Sync with My Dogs cross-passes",
  });

  await expect(lineupsSyncSwitch).not.toBeChecked();
  await lineupsSyncSwitch.click();
  await expect(lineupsSyncSwitch).toBeChecked();

  await expect(myDogsSyncSwitch).not.toBeChecked();
  await myDogsSyncSwitch.click();
  await expect(myDogsSyncSwitch).toBeChecked();
});

test("user can change their own password from Settings", async ({ page }) => {
  const email = uniqueEmail("password-change");

  await signupAndLoginAsTrainer(page, {
    email,
    name: "E2E Password Change",
    teamCode: "TEST",
  });

  await page.goto("/user-panel/settings");

  await page.getByRole("textbox", { name: "Current password", exact: true }).fill("wrong-current");
  await page.getByRole("textbox", { name: "New password", exact: true }).fill("brand-new-password");
  await page
    .getByRole("textbox", { name: "Repeat new password", exact: true })
    .fill("brand-new-password");
  await page.getByRole("button", { name: "Change password" }).click();
  // Wrong current password rejected - a snackbar, not a thrown/unhandled error.
  await expect(page.getByText("Incorrect password.")).toBeVisible();

  await page
    .getByRole("textbox", { name: "Current password", exact: true })
    .fill("password123");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed")).toBeVisible();

  await logout(page);

  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  // Scoped to the login card itself, not a bare role("alert") - notistack's
  // snackbars from the two change-password attempts above are mounted at
  // the app root and can still be visible/mid-fade-out across this
  // navigation, so an unscoped query is ambiguous.
  const loginCard = page.locator(".MuiCard-root", { hasText: "Login" });
  await expect(loginCard.getByRole("alert")).toBeVisible();

  await page.getByRole("textbox", { name: "Password", exact: true }).fill("brand-new-password");
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/\/user-panel/);
});
