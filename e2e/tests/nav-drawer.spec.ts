import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

// Clicking the actual nav links, not just URL navigation - a super-admin
// (also a trainer, per how the app treats them) sees every drawer section at
// once, so this one session covers every route in BottomNavBar.jsx. The
// drawer closes itself on every click (onClick={onDrawerToggle} on its own
// wrapping Box), so each link needs a fresh "open drawer" first. "Teams" is
// shared between the drawer (trainer route) and the always-visible bottom tab
// bar (user route) - scoped locators avoid the resulting ambiguity.
test("every drawer and bottom-tab nav link goes to its own route", async ({ page }) => {
  const email = uniqueEmail("super-admin");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Nav User", clubCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  const drawer = () => page.locator(".MuiDrawer-paper");
  const openDrawer = () => page.getByRole("button", { name: "open drawer" }).click();

  const clickDrawerLink = async (name: string, url: RegExp) => {
    await openDrawer();
    await drawer().getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(url);
  };

  // Trainer section.
  await clickDrawerLink("Training planning", /\/trainer-panel\/tasks$/);
  await clickDrawerLink("Dogs", /\/trainer-panel\/dogs$/);
  await clickDrawerLink("Dog tasks", /\/trainer-panel\/dog-tasks$/);
  await clickDrawerLink("Events", /\/trainer-panel\/events$/);
  await clickDrawerLink("Users", /\/trainer-panel\/users$/);
  await clickDrawerLink("Teams", /\/trainer-panel\/teams$/);

  // Super-admin section.
  await clickDrawerLink("Club switch", /\/club-switch$/);
  await clickDrawerLink("All users", /\/super-admin\/users$/);
  await clickDrawerLink("All dogs", /\/super-admin\/dogs$/);
  await clickDrawerLink("All dog tasks", /\/super-admin\/dog-tasks$/);
  await clickDrawerLink("All events", /\/super-admin\/events$/);
  await clickDrawerLink("All teams", /\/super-admin\/teams$/);
  await clickDrawerLink("All resources", /\/super-admin\/resources$/);
  await clickDrawerLink("App errors", /\/super-admin\/errors$/);

  // Shared bottom section.
  await clickDrawerLink("EJS Stats", /\/user-panel\/ejs-stats$/);
  await clickDrawerLink("Resources", /\/user-panel\/resources$/);
  await clickDrawerLink("Settings", /\/user-panel\/settings$/);
  await clickDrawerLink("About", /\/user-panel\/about$/);

  // The always-visible bottom tab bar - own routes, own container, to avoid
  // colliding with the drawer's same-labelled trainer-panel links.
  const bottomNav = page.locator(".MuiBottomNavigation-root");

  await bottomNav.getByRole("link", { name: "Training", exact: true }).click();
  await expect(page).toHaveURL(/\/user-panel\/tasks$/);

  await bottomNav.getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(page).toHaveURL(/\/user-panel\/calendar$/);

  await bottomNav.getByRole("link", { name: "My Dogs", exact: true }).click();
  await expect(page).toHaveURL(/\/user-panel\/my-dogs$/);

  await bottomNav.getByRole("link", { name: "Teams", exact: true }).click();
  await expect(page).toHaveURL(/\/user-panel\/teams$/);
});

// Regression: a route change that didn't click inside the drawer (its own
// onClick wrapper only fires on that) used to leave it open over the new
// page - browser back stands in for a real trigger (a notification deep
// link), since anything else is blocked by the open drawer's backdrop.
test("the drawer closes on browser back navigation, not just a click inside it", async ({
  page,
}) => {
  const email = uniqueEmail("drawer-user");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Drawer User", clubCode: "TEST" });

  // A real in-app <Link> click (pushState) - unlike page.goto(), so back
  // navigation stays client-side instead of reloading (which would reset
  // mobileOpen on its own, regardless of the fix under test).
  await page.getByRole("link", { name: "My Dogs", exact: true }).click();
  await expect(page).toHaveURL(/\/user-panel\/my-dogs$/);

  await page.getByRole("button", { name: "open drawer" }).click();
  await expect(page.locator(".MuiDrawer-paper")).toBeVisible();

  await page.goBack();

  await expect(page.locator(".MuiDrawer-paper")).not.toBeVisible();
});

test("the bottom nav bar is hidden on login and signup", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "open drawer" })).toHaveCount(0);
  await expect(page.locator(".MuiBottomNavigation-root")).toHaveCount(0);

  await page.goto("/signup");
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "open drawer" })).toHaveCount(0);
  await expect(page.locator(".MuiBottomNavigation-root")).toHaveCount(0);
});
