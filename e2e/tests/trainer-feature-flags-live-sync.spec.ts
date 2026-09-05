import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

// Proves club_settings_updated reaches an already-open page over SSE, not
// just "correct after reload" (a plain re-fetch would pass that trivially).
test("toggling a feature live-updates the nav on a second, already-open tab", async ({ page }) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Live Sync Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/features");
  const teamsSwitch = page.getByRole("switch", { name: "Teams & Lineups" });
  if (!(await teamsSwitch.isChecked())) await teamsSwitch.click();

  // A second tab, same session - its own SSE connection, already on a page showing the Teams link.
  const secondTab = await page.context().newPage();
  await secondTab.goto(page.url().replace(/\/trainer-panel\/features$/, "/user-panel/teams"));
  const bottomNav = secondTab.locator(".MuiBottomNavigation-root");
  await expect(bottomNav.getByText("Teams", { exact: true })).toBeVisible();

  await teamsSwitch.click();

  // No reload, no action on the second tab itself - only the SSE broadcast
  // from the first tab's toggle should cause this.
  await expect(bottomNav.getByText("Teams", { exact: true })).toHaveCount(0);

  await teamsSwitch.click();
  await expect(bottomNav.getByText("Teams", { exact: true })).toBeVisible();

  await secondTab.close();
});
