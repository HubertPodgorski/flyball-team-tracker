import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// Dog.syncCrossPasses: with the flag on, editing one lineup's cross-pass
// timing for a dog propagates to every *other* lineup entry with the same
// dog + same predecessor (never the pairing itself) - "same predecessor,
// same timing". Settings toggles are tested elsewhere; this proves the
// actual propagation through the real UI, not just that the switch flips.
test("syncCrossPasses propagates cross-pass timing between two lineups sharing the same pairing", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  const trainerName = `E2E Sync Trainer ${Date.now()}`;

  await signupAndLoginAsTrainer(page, { email, name: trainerName, teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const runnerName = `SyncRunner ${suffix}`;
  const predecessorName = `SyncPredecessor ${suffix}`;

  await addDog(page, runnerName);
  await addDog(page, predecessorName);

  // Turn on lineup-to-lineup sync for the runner - it has to be assigned to
  // this user first, same as every other Settings/My Dogs flow.
  await page.goto("/trainer-panel/users");
  await page.getByText(trainerName, { exact: true }).click();
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: runnerName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();

  const trainerCard = page.locator(".MuiCard-root", { hasText: trainerName });
  await expect(trainerCard.getByText(runnerName)).toBeVisible();

  await page.goto("/user-panel/settings");
  const syncSwitch = page.getByRole("switch", {
    name: "Sync between lineups (same predecessor → same timing)",
  });
  await syncSwitch.click();
  await expect(syncSwitch).toBeChecked();

  // One team, two lineups, both with [predecessor, runner] in the same
  // order (pool order is fixed, so checking both boxes gives the same
  // relative order each time) - the same pairing in both.
  await page.goto("/trainer-panel/teams");

  const teamName = `E2E Sync Team ${suffix}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Team name", exact: true }).fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(teamName)).toBeVisible();

  await page.getByText(teamName).click();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: predecessorName }).click();
  await expect(page.getByText(`1. ${predecessorName}`)).toBeVisible();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: runnerName }).click();
  await expect(page.getByText(`2. ${runnerName}`)).toBeVisible();

  const teamCard = page.locator(".MuiCard-root", { hasText: teamName });

  const createLineup = async () => {
    await page.getByRole("button", { name: "Add lineup" }).click();
    await page.getByRole("checkbox").nth(0).check();
    await page.getByRole("checkbox").nth(1).check();
    await page.getByRole("button", { name: "Create" }).click();
  };

  await createLineup();
  await expect(teamCard.getByRole("heading", { level: 3 })).toHaveCount(1);
  await createLineup();
  await expect(teamCard.getByRole("heading", { level: 3 })).toHaveCount(2);

  // Scoped to each accordion structurally (DOM order = creation order), not
  // by currently-visible text - MUI's Accordion keeps collapsed content in
  // the DOM (just hidden), so a page-wide "+ add" lookup can't tell which
  // lineup's row it actually landed on once more than one exists.
  const accordions = teamCard.locator(".MuiAccordion-root");
  const firstLineup = accordions.nth(0);
  const secondLineup = accordions.nth(1);

  // The sync only *updates* an existing cross-pass entry in the other
  // lineup - it never creates one from scratch - so the second lineup needs
  // its own (blank) entry for the same pairing before anything can land in
  // it. Save with no values filled in just to create the placeholder.
  await secondLineup.getByRole("heading", { level: 3 }).click();
  await secondLineup.getByText("+ add").nth(1).click();
  await page.getByRole("button", { name: "Save" }).click();

  // Now set real timing on the first lineup's runner-behind-predecessor
  // pairing.
  await firstLineup.getByRole("heading", { level: 3 }).click();
  await firstLineup.getByText("+ add").nth(1).click();
  await page.getByRole("spinbutton", { name: "Time" }).fill("2.5");
  await page.getByRole("textbox", { name: "Note", exact: true }).fill("Synced timing");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(firstLineup.getByText("2.5s")).toBeVisible();

  // The second lineup's own (previously blank) matching entry must now show
  // the same timing, without anyone having touched it directly. The row
  // summary only ever shows startingPosition/time, never the note - reopen
  // the modal to check that too.
  await expect(secondLineup.getByText("2.5s")).toBeVisible();
  await secondLineup.getByText("2.5s").click();
  await expect(page.getByRole("textbox", { name: "Note", exact: true })).toHaveValue(
    "Synced timing"
  );
  // The row summary showing "2.5s" only proves the row re-rendered - the
  // modal's own Time field is a separate prefill (see CrossPassModal.tsx's
  // real bug for why that distinction matters).
  await expect(page.getByRole("spinbutton", { name: "Time" })).toHaveValue("2.5");
});

// Dog.syncCrossPassesWithMyDogs: independently toggleable, bidirectional
// between a lineup's cross-pass and the standalone My Dogs list -
// lineup -> My Dogs upserts (creates if none exists yet); the other
// direction is exercised by crossPassController's own integration tests.
test("syncCrossPassesWithMyDogs pushes a lineup's cross-pass timing into My Dogs", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  const trainerName = `E2E MyDogsSync Trainer ${Date.now()}`;

  await signupAndLoginAsTrainer(page, { email, name: trainerName, teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const runnerName = `MyDogsSyncRunner ${suffix}`;
  const predecessorName = `MyDogsSyncPredecessor ${suffix}`;

  await addDog(page, runnerName);
  await addDog(page, predecessorName);

  await page.goto("/trainer-panel/users");
  await page.getByText(trainerName, { exact: true }).click();
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: runnerName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();

  const trainerCard = page.locator(".MuiCard-root", { hasText: trainerName });
  await expect(trainerCard.getByText(runnerName)).toBeVisible();

  await page.goto("/user-panel/settings");
  const syncSwitch = page.getByRole("switch", { name: "Sync with My Dogs cross-passes" });
  await syncSwitch.click();
  await expect(syncSwitch).toBeChecked();

  await page.goto("/trainer-panel/teams");

  const teamName = `E2E MyDogsSync Team ${suffix}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Team name", exact: true }).fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(teamName)).toBeVisible();

  await page.getByText(teamName).click();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: predecessorName }).click();
  await expect(page.getByText(`1. ${predecessorName}`)).toBeVisible();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: runnerName }).click();
  await expect(page.getByText(`2. ${runnerName}`)).toBeVisible();

  await page.getByRole("button", { name: "Add lineup" }).click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Create" }).click();

  const teamCard = page.locator(".MuiCard-root", { hasText: teamName });
  const lineupHeading = teamCard.getByRole("heading", { level: 3 });
  await expect(lineupHeading).toContainText("Lineup");
  await lineupHeading.click();

  await page.getByText("+ add").nth(1).click();
  await page.getByRole("spinbutton", { name: "Time" }).fill("3.7");
  await page.getByRole("textbox", { name: "Note", exact: true }).fill("Pushed to My Dogs");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("3.7s")).toBeVisible();

  // A standalone cross-pass should now exist for the runner, upserted from
  // the lineup entry, without anyone creating it directly on this page.
  await page.goto("/user-panel/my-dogs");
  const runnerCard = page.locator(".MuiCard-root", { hasText: runnerName });
  await expect(runnerCard.getByText(predecessorName)).toBeVisible();
  await expect(runnerCard.getByText("3.7")).toBeVisible();
  await expect(runnerCard.getByText("Pushed to My Dogs")).toBeVisible();
});
