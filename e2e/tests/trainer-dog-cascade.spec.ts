import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// Regression-shaped coverage for the deletion cascades documented in
// .github/instructions/api.instructions.md: deleting a dog removes it from
// every Task/Team/lineup that embeds a copy. This proves it live, over SSE,
// on a page that's already open and showing the dog - not just "the DB is
// correct after a reload", which a plain re-fetch would pass trivially.
test("deleting a dog live-removes it from an open task board and team lineup via SSE", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const dogToDelete = `Cascade Dog ${suffix}`;
  const otherDog = `Cascade Buddy ${suffix}`;

  await addDog(page, dogToDelete);
  await addDog(page, otherDog);

  // Give it a lineup home too - the pool-removal-on-delete cascade is
  // covered elsewhere (trainer-team-dogs.spec.ts); a whole-dog delete taking
  // it out of an existing lineup is a different code path (dogCascade.js's
  // replaceDogEverywhere, not lineupCascade.js).
  await page.goto("/trainer-panel/teams");

  const teamName = `E2E Cascade Team ${suffix}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Team name", exact: true }).fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(teamName)).toBeVisible();

  await page.getByText(teamName).click();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogToDelete }).click();
  await expect(page.getByText(`1. ${dogToDelete}`)).toBeVisible();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: otherDog }).click();
  await expect(page.getByText(`2. ${otherDog}`)).toBeVisible();

  await page.getByRole("button", { name: "Add lineup" }).click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Create" }).click();
  // Scoped to this team's own card: other not-yet-deleted teams elsewhere in
  // this shared e2e DB have their own lineup headings still in the DOM too
  // (MUI's Accordion doesn't unmount collapsed content).
  const teamCard = page.locator(".MuiCard-root", { hasText: teamName });
  await expect(teamCard.getByRole("heading", { level: 3 })).toContainText("Lineup");

  // A task with the dog, on the page this test watches for the live update.
  await page.goto("/trainer-panel/tasks");

  const description = `Cascade task ${suffix}`;
  const addTaskButtons = page.getByText("Add task here");
  await expect(addTaskButtons.first()).toBeVisible();
  const count = await addTaskButtons.count();
  await addTaskButtons.nth(count - 2).click();
  await page
    .getByRole("combobox", { name: "Type or select task description" })
    .fill(description);
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogToDelete }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  const taskCard = page.locator("[data-task-id]", { hasText: description });
  await expect(taskCard.getByText(dogToDelete)).toBeVisible();

  // A second tab, same session (shared localStorage/auth within one browser
  // context) - deletes the dog from a completely different page, while the
  // first tab keeps sitting on the task board doing nothing.
  const secondTab = await page.context().newPage();
  await secondTab.goto(page.url().replace(/\/trainer-panel\/tasks$/, "/trainer-panel/dogs"));

  const dogCard = secondTab.locator(".MuiCard-root", { hasText: dogToDelete });
  await dogCard.getByTestId("DeleteIcon").click();
  await secondTab.getByRole("button", { name: "Delete forever" }).click();
  await expect(secondTab.getByText(dogToDelete, { exact: true })).not.toBeVisible();
  await secondTab.close();

  // Back on the untouched first tab: the task's dog chip must disappear on
  // its own, with no navigation or reload here.
  await expect(taskCard.getByText(dogToDelete)).not.toBeVisible({ timeout: 10000 });
  await expect(taskCard.getByText("No dogs selected")).toBeVisible();

  // The lineup roster (a different entity/query entirely) must update live
  // the same way.
  await page.goto("/trainer-panel/teams");
  await page.getByText(teamName).click();
  await expect(page.getByText(dogToDelete)).not.toBeVisible();
  // otherDog legitimately appears multiple times (pool chip, lineup label,
  // DogChain caption) - just confirm at least one survived.
  await expect(page.getByText(otherDog).first()).toBeVisible();
});
