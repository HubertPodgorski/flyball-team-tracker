import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import {
  promoteToTrainer,
  promoteToSuperAdmin,
  seedTeamWithLineup,
  seedLineupLinkedTask,
} from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";
import { Page } from "@playwright/test";

// Waits past useClubFeatures' optimistic all-on default and the page's own
// /tasks + /teams count fetch, both of which can otherwise race a read.
const gotoFeaturesLoaded = async (page: Page) => {
  const loaded = page.waitForResponse(
    (res) => res.url().includes("/club-settings") && res.request().method() === "GET"
  );
  await page.goto("/trainer-panel/features");
  await loaded;
  await page.waitForTimeout(300);
};

// The confirm dialog only fires when a lineup-linked task exists - checking
// for it either way keeps this shared-club file robust to seeded leftovers.
const disableTeamsAndLineups = async (page: Page, teamsSwitch: import("@playwright/test").Locator) => {
  await teamsSwitch.click();

  const removeButton = page.getByRole("button", { name: "Remove" });

  try {
    await expect(removeButton).toBeVisible({ timeout: 1000 });
    await removeButton.click();
  } catch {
    // No confirm dialog - nothing was linked, which is fine.
  }
};

test("trainer can disable a feature and it disappears from nav, with its dependent cascading off too", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Feature Flags Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await gotoFeaturesLoaded(page);

  const teamsSwitch = page.getByRole("switch", { name: "Teams & Lineups" });
  const crossPassesSwitch = page.getByRole("switch", { name: "Cross-passes" });

  // Shared club, club-wide settings - force known state, don't assume defaults.
  if (!(await teamsSwitch.isChecked())) await teamsSwitch.click();
  if (!(await crossPassesSwitch.isChecked())) await crossPassesSwitch.click();
  await expect(crossPassesSwitch).toBeEnabled();

  await disableTeamsAndLineups(page, teamsSwitch);

  // The one real dependency: no lineups, nothing for a cross-pass to attach to.
  await expect(crossPassesSwitch).not.toBeChecked();
  await expect(crossPassesSwitch).toBeDisabled();
  await expect(page.getByText("Requires Teams & Lineups.")).toBeVisible();
  await expect(
    page.getByText("Cross-passes was also turned off - it has nothing to attach to without lineups.")
  ).toBeVisible();

  // Nav reacts immediately, no reload.
  await page.getByRole("button", { name: "open drawer" }).click();
  await expect(page.locator(".MuiDrawer-paper").getByRole("link", { name: "Teams", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");

  // Survives a real reload too (persisted server-side, not just local state).
  await page.reload();
  await expect(page.getByRole("switch", { name: "Teams & Lineups" })).not.toBeChecked();
  await expect(page.getByRole("switch", { name: "Cross-passes" })).not.toBeChecked();

  // Turning it back on frees Cross-passes again, but doesn't force it on.
  await page.getByRole("switch", { name: "Teams & Lineups" }).click();
  await expect(page.getByRole("switch", { name: "Cross-passes" })).toBeEnabled();
  await expect(page.getByRole("switch", { name: "Cross-passes" })).not.toBeChecked();

  await page.getByRole("button", { name: "open drawer" }).click();
  await expect(page.locator(".MuiDrawer-paper").getByRole("link", { name: "Teams", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  // Leave the shared club's flags back at their default for whatever runs next.
  await gotoFeaturesLoaded(page);
  await page.getByRole("switch", { name: "Cross-passes" }).click();
});

test("disabling Teams & Lineups with nothing linked applies immediately, no confirmation needed", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  // A club no other test links a task's lineup in, so zero-linked-tasks is
  // guaranteed rather than assumed.
  await signupAndLoginAsTrainer(page, {
    email,
    name: "No Linked Tasks Trainer",
    clubCode: "WEST_SIDE_DOGZ",
  });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await gotoFeaturesLoaded(page);
  const teamsSwitch = page.getByRole("switch", { name: "Teams & Lineups" });
  if (!(await teamsSwitch.isChecked())) await teamsSwitch.click();

  await teamsSwitch.click();

  await expect(page.getByText("currently linked to a lineup", { exact: false })).toHaveCount(0);
  await expect(teamsSwitch).not.toBeChecked();

  await gotoFeaturesLoaded(page);
  await page.getByRole("switch", { name: "Teams & Lineups" }).click();
});

// Split into 3 focused tests - one combined test chaining ~9 reloads reliably
// hung on a later goto(); each piece on its own, with far fewer reloads, is solid.

test("disabling Cross-passes hides the lineup cross-pass editor (TaskLineupModal)", async ({
  page,
}) => {
  const email = uniqueEmail("super-admin");
  await signupAndLoginAsTrainer(page, { email, name: "Cross-pass Scope Admin", clubCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  const { teamId, lineupId, dogs } = await seedTeamWithLineup("TEST_TEAM");
  const taskDescription = `Seeded Lineup Task ${Date.now()}`;
  // Clicking the task opens TaskLineupModal (a plain Dialog) - avoids the
  // Teams page's flaky nested-Collapse accordions entirely.
  await seedLineupLinkedTask("TEST_TEAM", teamId, lineupId, taskDescription, dogs);

  // Shared club, club-wide settings - force both flags on rather than assume.
  await gotoFeaturesLoaded(page);
  const teamsSwitch = page.getByRole("switch", { name: "Teams & Lineups" });
  const crossPassesSwitch = page.getByRole("switch", { name: "Cross-passes" });
  if (!(await teamsSwitch.isChecked())) await teamsSwitch.click();
  if (!(await crossPassesSwitch.isChecked())) await crossPassesSwitch.click();

  await page.goto("/user-panel/tasks");
  await page.getByText(taskDescription, { exact: true }).click();
  await expect(page.getByText("+ add").first()).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  // Cross-passes only - Teams & Lineups itself stays on.
  await gotoFeaturesLoaded(page);
  await page.getByRole("switch", { name: "Cross-passes" }).click();
  await expect(page.getByRole("switch", { name: "Teams & Lineups" })).toBeChecked();

  await page.goto("/user-panel/tasks");
  await page.getByText(taskDescription, { exact: true }).click();
  await expect(page.getByText("+ add")).toHaveCount(0);
  await page.getByRole("button", { name: "Close" }).click();

  await gotoFeaturesLoaded(page);
  await page.getByRole("switch", { name: "Cross-passes" }).click();
});

test("Net time sums each dog's own cross-pass time, and cascades off with Cross-passes", async ({
  page,
}) => {
  // Several feature-page round trips plus three modal open/close cycles -
  // past the default 30s budget.
  test.slow();

  const email = uniqueEmail("super-admin");
  await signupAndLoginAsTrainer(page, { email, name: "Net Time Admin", clubCode: "TEST" });
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  const { teamId, lineupId, dogs, dogAName, dogBName } = await seedTeamWithLineup("TEST_TEAM");
  const taskDescription = `Net Time Task ${Date.now()}`;
  await seedLineupLinkedTask("TEST_TEAM", teamId, lineupId, taskDescription, dogs);

  await gotoFeaturesLoaded(page);
  const teamsSwitch = page.getByRole("switch", { name: "Teams & Lineups" });
  const crossPassesSwitch = page.getByRole("switch", { name: "Cross-passes" });
  const netTimeSwitch = page.getByRole("switch", { name: "Net Time" });
  if (!(await teamsSwitch.isChecked())) await teamsSwitch.click();
  if (!(await crossPassesSwitch.isChecked())) await crossPassesSwitch.click();
  if (!(await netTimeSwitch.isChecked())) await netTimeSwitch.click();

  const openModal = async () => {
    await page.goto("/user-panel/tasks");
    await page.getByText(taskDescription, { exact: true }).click();
  };

  await openModal();
  // Dog A runs on the lights, Dog B runs on Dog A - each gets its own time.
  await page.getByRole("dialog").getByRole("button", { name: new RegExp(`^${dogAName}`) }).click();
  await page.getByRole("spinbutton", { name: "Time (s)" }).fill("4.2");
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByRole("dialog").getByRole("button", { name: new RegExp(`^${dogBName}`) }).click();
  await page.getByRole("spinbutton", { name: "Time (s)" }).fill("4.5");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Net time: 8.7s")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  // Net Time off, Cross-passes stays on - individual times remain, no total.
  await gotoFeaturesLoaded(page);
  await netTimeSwitch.click();

  await openModal();
  await expect(page.getByText("4.2s")).toBeVisible();
  await expect(page.getByText("Net time: 8.7s")).toHaveCount(0);
  await page.getByRole("button", { name: "Close" }).click();

  await gotoFeaturesLoaded(page);
  await netTimeSwitch.click();
  await expect(netTimeSwitch).toBeChecked();

  await openModal();
  await expect(page.getByText("Net time: 8.7s")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  // Turning off the thing Net Time depends on takes it down too.
  await gotoFeaturesLoaded(page);
  await crossPassesSwitch.click();
  await expect(
    page.getByText("Net time was also turned off - it has nothing to add up without cross-passes.")
  ).toBeVisible();
  await expect(netTimeSwitch).toBeDisabled();
  await expect(netTimeSwitch).not.toBeChecked();

  await crossPassesSwitch.click();
  await expect(netTimeSwitch).not.toBeChecked();
  await netTimeSwitch.click();
});

test("disabling Cross-passes hides the Settings sync section", async ({ page }) => {
  const email = uniqueEmail("super-admin");
  await signupAndLoginAsTrainer(page, { email, name: "Settings Sync Admin", clubCode: "TEST" });
  // SUPER_ADMIN bypasses Settings' own-dogs requirement for this section.
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  await gotoFeaturesLoaded(page);
  const crossPassesSwitch = page.getByRole("switch", { name: "Cross-passes" });
  if (!(await crossPassesSwitch.isChecked())) await crossPassesSwitch.click();

  await page.goto("/user-panel/settings");
  await expect(page.getByText("Cross-pass syncing")).toBeVisible();

  await gotoFeaturesLoaded(page);
  await crossPassesSwitch.click();

  await page.goto("/user-panel/settings");
  // toHaveCount(0) resolves the instant it observes 0 matches - checked right
  // after goto, that's just as true of a still-blank page. Wait for the page
  // to have actually rendered first, via something always there regardless.
  await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible();
  await expect(page.getByText("Cross-pass syncing")).toHaveCount(0);

  await gotoFeaturesLoaded(page);
  await crossPassesSwitch.click();
});

test("disabling Cross-passes leaves a dog's own My Dogs cross-passes unaffected", async ({
  page,
}) => {
  const email = uniqueEmail("super-admin");
  await signupAndLoginAsTrainer(page, { email, name: "My Dogs Unaffected Admin", clubCode: "TEST" });
  // SUPER_ADMIN, not a trainer: My Dogs' "Dog" picker combobox only renders
  // for super-admins - a trainer just sees their own already-assigned dogs.
  await promoteToSuperAdmin(email);
  await logout(page);
  await login(page, email);

  const realDogName = `Real My Dogs Test Dog ${Date.now()}`;
  await addDog(page, realDogName);

  await gotoFeaturesLoaded(page);
  const crossPassesSwitch = page.getByRole("switch", { name: "Cross-passes" });
  if (!(await crossPassesSwitch.isChecked())) await crossPassesSwitch.click();
  await crossPassesSwitch.click();

  // The pool dog seeded in other tests lives on the Team doc, not a user's
  // `dogs`, so it won't show up here - a real user-owned dog is needed.
  await page.goto("/user-panel/my-dogs");
  await page.getByRole("combobox", { name: "Dog", exact: true }).click();
  await page.getByRole("option", { name: realDogName }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Cross Passes", { exact: true })).toBeVisible();

  await gotoFeaturesLoaded(page);
  await crossPassesSwitch.click();
});

// TeamLineupPicker is a third render site of the same gated component, next
// to TaskLineupModal (above) and LineupAccordion - worth its own check.
test("disabling Cross-passes also hides the inline cross-pass editor when creating a task in Team lineup mode", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Team Picker Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const { teamId, lineupId, dogs, teamName, lineupName } = await seedTeamWithLineup("TEST_TEAM");
  await seedLineupLinkedTask("TEST_TEAM", teamId, lineupId, `Unrelated Task ${Date.now()}`, dogs);

  await gotoFeaturesLoaded(page);
  const crossPassesSwitch = page.getByRole("switch", { name: "Cross-passes" });
  if (!(await crossPassesSwitch.isChecked())) await crossPassesSwitch.click();

  await page.goto("/trainer-panel/tasks");
  await page.getByText("Add task here").first().click();
  await page.getByRole("button", { name: "Team lineup" }).click();
  await page.getByRole("combobox", { name: "Team", exact: true }).click();
  await page.getByRole("option", { name: teamName }).click();
  await page.getByRole("combobox", { name: "Lineup", exact: true }).click();
  await page.getByRole("option", { name: new RegExp(lineupName) }).click();
  await expect(page.getByText("+ add").first()).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  await gotoFeaturesLoaded(page);
  await crossPassesSwitch.click();

  await page.goto("/trainer-panel/tasks");
  await page.getByText("Add task here").first().click();
  await page.getByRole("button", { name: "Team lineup" }).click();
  await page.getByRole("combobox", { name: "Team", exact: true }).click();
  await page.getByRole("option", { name: teamName }).click();
  await page.getByRole("combobox", { name: "Lineup", exact: true }).click();
  await page.getByRole("option", { name: new RegExp(lineupName) }).click();
  await expect(page.getByText("+ add")).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel" }).click();

  await gotoFeaturesLoaded(page);
  await crossPassesSwitch.click();
});

test("turning off Teams & Lineups detaches an existing lineup-linked task, keeping its dogs", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Detach Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const { teamId, lineupId, dogs, dogAName, dogBName } = await seedTeamWithLineup("TEST_TEAM");
  const taskDescription = `Detach Me Task ${Date.now()}`;
  await seedLineupLinkedTask("TEST_TEAM", teamId, lineupId, taskDescription, dogs);

  // Shared club - force known starting state rather than assume.
  await gotoFeaturesLoaded(page);
  const teamsSwitch = page.getByRole("switch", { name: "Teams & Lineups" });
  if (!(await teamsSwitch.isChecked())) await teamsSwitch.click();

  // Before: task is in "team" mode - a live lineup pick, not a dog-chip snapshot.
  await page.goto("/trainer-panel/tasks");
  await page.getByText(taskDescription, { exact: true }).click();
  await expect(page.getByRole("button", { name: "Team lineup" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await page.getByRole("button", { name: "Cancel" }).click();

  await gotoFeaturesLoaded(page);
  await teamsSwitch.click();
  // A linked task exists, so the confirm-before-detach dialog fires here.
  await expect(page.getByText("currently linked to a lineup", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(teamsSwitch).not.toBeChecked();

  // After: task card still shows both dogs, from its own frozen snapshot.
  await page.goto("/trainer-panel/tasks");
  const taskCard = page.locator(".MuiCard-root", { hasText: taskDescription });
  await expect(taskCard.getByText(dogAName, { exact: true })).toBeVisible();
  await expect(taskCard.getByText(dogBName, { exact: true })).toBeVisible();

  // No mode toggle at all in the edit form - nothing left to switch to.
  await taskCard.click();
  await expect(page.getByRole("button", { name: "Team lineup" })).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel" }).click();

  // Proves the backend cleared matchupRef - a surviving link would come back pre-selected.
  await gotoFeaturesLoaded(page);
  await teamsSwitch.click();

  await page.goto("/trainer-panel/tasks");
  await page.getByText(taskDescription, { exact: true }).click();
  await expect(page.getByRole("button", { name: "Team lineup" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await page.getByRole("button", { name: "Cancel" }).click();

  // Re-enabling teamsAndLineups doesn't restore crossPasses - reset it too.
  await gotoFeaturesLoaded(page);
  await page.getByRole("switch", { name: "Cross-passes" }).click();
});

test("canceling the disable-Teams-and-Lineups warning leaves everything untouched", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email, name: "Cancel Confirm Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const { teamId, lineupId, dogs } = await seedTeamWithLineup("TEST_TEAM");
  const taskDescription = `Dont Touch Me Task ${Date.now()}`;
  await seedLineupLinkedTask("TEST_TEAM", teamId, lineupId, taskDescription, dogs);

  await gotoFeaturesLoaded(page);
  const teamsSwitch = page.getByRole("switch", { name: "Teams & Lineups" });
  if (!(await teamsSwitch.isChecked())) await teamsSwitch.click();

  await teamsSwitch.click();
  await expect(page.getByText("currently linked to a lineup", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  // Nothing happened - no request even fired, let alone a detach.
  await expect(teamsSwitch).toBeChecked();
  await page.reload();
  await expect(page.getByRole("switch", { name: "Teams & Lineups" })).toBeChecked();

  await page.goto("/trainer-panel/tasks");
  await page.getByText(taskDescription, { exact: true }).click();
  await expect(page.getByRole("button", { name: "Team lineup" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("a plain club member's lineup card is not expandable once Cross-passes is off - nothing left to show", async ({
  page,
}) => {
  const trainerEmail = uniqueEmail("trainer");
  await signupAndLoginAsTrainer(page, { email: trainerEmail, name: "Flag Trainer", clubCode: "TEST" });
  await promoteToTrainer(trainerEmail);
  await logout(page);
  await login(page, trainerEmail);

  const { teamName, lineupName } = await seedTeamWithLineup("TEST_TEAM");

  await gotoFeaturesLoaded(page);
  const crossPassesSwitch = page.getByRole("switch", { name: "Cross-passes" });
  if (!(await crossPassesSwitch.isChecked())) await crossPassesSwitch.click();
  await crossPassesSwitch.click();
  await logout(page);

  const memberEmail = uniqueEmail("member");
  // No promoteToTrainer - a plain club member sees Teams read-only (editable={false}).
  await signupAndLoginAsTrainer(page, { email: memberEmail, name: "Plain Member", clubCode: "TEST" });

  await page.goto("/user-panel/teams");
  await page.getByText(teamName, { exact: true }).click();

  const lineupRow = page.getByText(new RegExp(lineupName));

  await expect(lineupRow).toBeVisible();
  await expect(page.getByRole("button", { expanded: false })).toHaveCount(0);

  await lineupRow.click();
  await expect(page.getByText("+ add")).toHaveCount(0);

  await logout(page);
  await login(page, trainerEmail);
  await gotoFeaturesLoaded(page);
  await crossPassesSwitch.click();
  await logout(page);
  await login(page, memberEmail);

  // Not re-clicked through the flaky nested Collapse pair (see TeamCard.tsx) -
  // just that the expand affordance itself is back.
  await page.goto("/user-panel/teams");
  await page.getByText(teamName, { exact: true }).click();
  await expect(page.getByRole("button", { expanded: false, name: new RegExp(lineupName) })).toBeVisible();
});
