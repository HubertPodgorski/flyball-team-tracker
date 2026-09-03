import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

test("trainer can assign multiple dogs to a task, reorder them, then delete the row", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const dogAName = `TaskDog A ${suffix}`;
  const dogBName = `TaskDog B ${suffix}`;

  await addDog(page, dogAName);
  await addDog(page, dogBName);

  await page.goto("/trainer-panel/tasks");

  // LineupTaskLegend, always shown above the board.
  await expect(page.getByText("Regular task", { exact: true })).toBeVisible();
  await expect(page.getByText("Lineup task", { exact: true })).toBeVisible();

  const description = `Multi-dog drill ${suffix}`;

  const addTaskButtons = page.getByText("Add task here");
  // .count() has no auto-wait - without this, it can race the initial tasks
  // fetch and return a stale/zero count, throwing the index below off.
  await expect(addTaskButtons.first()).toBeVisible();
  const count = await addTaskButtons.count();
  await addTaskButtons.nth(count - 2).click();

  await page
    .getByRole("combobox", { name: "Type or select task description" })
    .fill(description);

  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogAName }).click();
  await page.getByRole("option", { name: dogBName }).click();
  await page.keyboard.press("Escape");

  // With 2+ dogs picked, a reorder section appears in the same form. Scope
  // to that section specifically - the Dogs field above it also renders each
  // picked dog's name as a selected-value chip, which would otherwise double
  // - match the same text.
  const dogsOrderSection = page.getByText("Set dogs order").locator("..");
  await expect(dogsOrderSection).toBeVisible();

  const dogOrderRows = dogsOrderSection.getByText(/TaskDog [AB]/);
  await expect(dogOrderRows).toHaveText([dogAName, dogBName]);

  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  const taskCard = page.locator("[data-task-id]", { hasText: description });
  await expect(taskCard.getByText(dogAName)).toBeVisible();
  await expect(taskCard.getByText(dogBName)).toBeVisible();

  // Reopen and reorder: drag B above A.
  await page.getByText(description, { exact: true }).click();

  // Checked before touching anything else - a test that only ever
  // rearranges a field can't tell a correctly prefilled form from a blank
  // one (see CrossPassModal.tsx's real bug, caught only by checking this).
  // Previously this reopen went straight to dragging with no such check -
  // if the reopen had come up blank, rowHandleFor() below would have found
  // nothing, boundingBox() would be null, the drag would silently no-op,
  // and the test would still pass.
  await expect(
    page.getByRole("combobox", { name: "Type or select task description" })
  ).toHaveValue(description);

  const reopenedDogsOrderSection = page.getByText("Set dogs order").locator("..");
  await expect(reopenedDogsOrderSection).toBeVisible();
  await expect(reopenedDogsOrderSection.getByText(/TaskDog [AB]/)).toHaveText([
    dogAName,
    dogBName,
  ]);

  // DogOrderRowStyled's Typography is a direct child - its own parent is
  // exactly the draggable row container. Scoped to the reorder section, not
  // the Dogs field's selected-value chips above it (same dog names).
  const rowHandleFor = (name: string) =>
    reopenedDogsOrderSection.getByText(name, { exact: true }).locator("..");

  const fromBox = await rowHandleFor(dogBName).boundingBox();
  const toBox = await rowHandleFor(dogAName).boundingBox();

  if (fromBox && toBox) {
    const fromX = fromBox.x + fromBox.width / 2;
    const fromY = fromBox.y + fromBox.height / 2;
    const toX = toBox.x + toBox.width / 2;
    const toY = toBox.y + toBox.height / 2;

    await page.mouse.move(fromX, fromY);
    await page.mouse.down();
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(fromX + ((toX - fromX) * i) / steps, fromY + ((toY - fromY) * i) / steps);
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
  }

  await page.getByRole("button", { name: "Submit" }).click();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  // Delete the whole row this task lives in - its own row's delete icon
  // (distinct from the per-task delete icon inside the card).
  const row = page.locator("[data-task-id]", { hasText: description }).locator(
    "xpath=ancestor::div[.//*[@data-row-handle]][1]"
  );
  await row.locator('[data-testid="DeleteIcon"]').first().click();
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText(description, { exact: true })).not.toBeVisible();
});

test("trainer can link a task to a team's lineup instead of picking dogs directly", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const dogAName = `LineupTaskDog A ${suffix}`;
  const dogBName = `LineupTaskDog B ${suffix}`;

  await addDog(page, dogAName);
  await addDog(page, dogBName);

  await page.goto("/trainer-panel/teams");

  const teamName = `E2E Task Team ${suffix}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Team name", exact: true }).fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(teamName)).toBeVisible();

  await page.getByText(teamName).click();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogAName }).click();
  await expect(page.getByText(`1. ${dogAName}`)).toBeVisible();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogBName }).click();
  await expect(page.getByText(`2. ${dogBName}`)).toBeVisible();

  await page.getByRole("button", { name: "Add lineup" }).click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Create" }).click();
  // Scoped to this team's own card: other not-yet-deleted teams elsewhere in
  // this shared e2e DB have their own lineup headings still in the DOM too
  // (MUI's Accordion doesn't unmount collapsed content).
  const teamCard = page.locator(".MuiCard-root", { hasText: teamName });
  await expect(teamCard.getByRole("heading", { level: 3 })).toContainText("Lineup");

  await page.goto("/trainer-panel/tasks");

  const description = `Lineup-linked drill ${suffix}`;

  const addTaskButtons = page.getByText("Add task here");
  // .count() has no auto-wait - without this, it can race the initial tasks
  // fetch and return a stale/zero count, throwing the index below off.
  await expect(addTaskButtons.first()).toBeVisible();
  const count = await addTaskButtons.count();
  await addTaskButtons.nth(count - 2).click();

  await page
    .getByRole("combobox", { name: "Type or select task description" })
    .fill(description);

  await page.getByRole("button", { name: "Team lineup" }).click();
  await page.getByRole("combobox", { name: "Team", exact: true }).click();
  await page.getByRole("option", { name: teamName }).click();
  await page.getByRole("combobox", { name: "Lineup", exact: true }).click();
  // Lineup fallback label includes the pool's jump height.
  await page.getByRole("option").first().click();

  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  // Dogs come from the lineup, not a manual pick - both should show, and the
  // card is visually tinted as lineup-linked.
  const taskCard = page.locator("[data-task-id]", { hasText: description });
  await expect(taskCard.getByText(dogAName)).toBeVisible();
  await expect(taskCard.getByText(dogBName)).toBeVisible();

  // Reopen it - TaskForm.tsx's own closest analog to CrossPassModal.tsx's
  // real bug: a "mode" toggle (dogs vs. team lineup) that swaps which
  // fields are mounted. Never actually proven that reopening a
  // lineup-linked task restores "Team lineup" mode with the right team and
  // lineup selected, rather than silently falling back to plain "Dogs"
  // mode with nothing picked.
  await taskCard.click();
  await expect(
    page.getByRole("combobox", { name: "Type or select task description" })
  ).toHaveValue(description);
  await expect(page.getByRole("button", { name: "Team lineup" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByRole("combobox", { name: "Team", exact: true })).toHaveText(teamName);
  await expect(page.getByRole("combobox", { name: "Lineup", exact: true })).not.toHaveText("");
  await page.getByRole("button", { name: "Cancel" }).click();
});

test("trainer can move a task between the two columns of a row via drag", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const reorderRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH" && request.url().includes("/tasks/reorder")) {
      reorderRequests.push(request.postData() ?? "");
    }
  });

  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  await page.goto("/trainer-panel/tasks");

  const suffix = Date.now();
  const taskInColumnA = `Column A task ${suffix}`;
  const taskInColumnB = `Column B task ${suffix}`;

  // Creating task A can trigger row-compaction (getRowCompactionUpdates
  // closing a gap left by an earlier test's row deletion elsewhere in this
  // shared DB), which re-renders the whole grid with different rowIndex
  // values - so a button index captured before task A exists is not a
  // reliable way to reach "the same row's other column" afterwards, and
  // geometric Y-matching turned out no better: with enough accumulated rows
  // in this shared e2e DB, non-uniform row heights can put some other row's
  // button closer in Y than the true next-slot one. Anchor structurally
  // instead - go from task A's own card up to its row container (identified
  // by the same [data-row-handle] descendant used for row-scoping
  // elsewhere in this suite), then take that row's *other* "Add task here"
  // (index 0 is column A's own, already spoken for by task A's card).
  const addTaskButtons = page.getByText("Add task here");
  // .count() has no auto-wait - without this, it can race the initial tasks
  // fetch and return a stale/zero count.
  await expect(addTaskButtons.first()).toBeVisible();
  const count = await addTaskButtons.count();

  await addTaskButtons.nth(count - 2).click();
  await page
    .getByRole("combobox", { name: "Type or select task description" })
    .fill(taskInColumnA);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(taskInColumnA, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  const cardA = page.locator("[data-task-id]", { hasText: taskInColumnA });
  const cardABox = await cardA.boundingBox();

  expect(cardABox).not.toBeNull();

  const rowOfA = cardA.locator("xpath=ancestor::div[.//*[@data-row-handle]][1]");
  const columnBButton = rowOfA.getByText("Add task here").nth(1);

  await columnBButton.click();
  await page
    .getByRole("combobox", { name: "Type or select task description" })
    .fill(taskInColumnB);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(taskInColumnB, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  const cardBBox = await page
    .locator("[data-task-id]", { hasText: taskInColumnB })
    .boundingBox();

  // The whole point of this setup: same row (close Y), other column
  // (greater X) - confirm it actually landed there before dragging.
  // Re-measure card A here rather than reusing the box captured before task
  // B existed - creating task B can trigger row-compaction elsewhere in this
  // shared-DB grid, reflowing every row's Y position. The earlier box would
  // then be stale and this check would fail even though cardA and cardB are,
  // structurally, still in the same row (columnBButton was derived from
  // cardA's own row ancestor, which doesn't shift).
  const cardABoxNow = await cardA.boundingBox();
  expect(cardBBox).not.toBeNull();
  expect(cardABoxNow).not.toBeNull();
  if (cardABoxNow && cardBBox) {
    expect(Math.abs(cardBBox.y - cardABoxNow.y)).toBeLessThan(5);
    expect(cardBBox.x).toBeGreaterThan(cardABoxNow.x);
  }

  // Setup above (adding tasks) also triggers its own reorder PATCHes -
  // clear those so the count below reflects only the drag itself.
  reorderRequests.length = 0;

  // Drag column A's task onto column B's task - the group="tasks-cells"
  // wiring (react-sortablejs) is what lets a card cross into another cell.
  // (cardA already declared above.)
  const cardB = page.locator("[data-task-id]", { hasText: taskInColumnB });

  const fromBox = await cardA.boundingBox();
  const toBox = await cardB.boundingBox();

  expect(fromBox).not.toBeNull();
  expect(toBox).not.toBeNull();

  if (fromBox && toBox) {
    const fromX = fromBox.x + fromBox.width / 2;
    const fromY = fromBox.y + fromBox.height / 2;
    const toX = toBox.x + toBox.width / 2;
    // Dead-center on the target card is an ambiguous drop zone for
    // react-sortablejs (empirically: the reorder mutation never fires,
    // it just snaps back) - offsetting toward the target's bottom edge
    // reliably resolves to "insert after".
    const toY = toBox.y + toBox.height * 0.85;

    await page.mouse.move(fromX, fromY);
    await page.mouse.down();
    // Small initial nudge to cross react-sortablejs's fallback drag-start
    // threshold before the main movement - without it the drag never
    // actually engages (empirically: no drag ghost appears at all).
    await page.mouse.move(fromX + 5, fromY + 2);
    await page.waitForTimeout(80);
    const steps = 30;
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(fromX + ((toX - fromX) * i) / steps, fromY + ((toY - fromY) * i) / steps);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(300);
    await page.mouse.up();
  }

  // The drag must have actually registered as a move, not silently dropped
  // back in place - otherwise the checks below would pass even if dragging
  // was completely broken. Poll, not a bare check: onEnd -> moveTasksCell ->
  // mutate() still needs a beat after the raw mouseup DOM event to reach the
  // network layer.
  await expect.poll(() => reorderRequests.length).toBeGreaterThan(0);

  // Both tasks must survive the move (not vanish/duplicate) - reload to
  // confirm it persisted server-side, not just an optimistic client update.
  await page.reload();
  await expect(page.getByText(taskInColumnA, { exact: true })).toBeVisible();
  await expect(page.getByText(taskInColumnB, { exact: true })).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("trainer can switch an existing task from picked dogs to a team lineup", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const soloDogName = `ModeSwitch Solo ${suffix}`;
  const dogAName = `ModeSwitch A ${suffix}`;
  const dogBName = `ModeSwitch B ${suffix}`;

  await addDog(page, soloDogName);
  await addDog(page, dogAName);
  await addDog(page, dogBName);

  await page.goto("/trainer-panel/teams");

  const teamName = `E2E ModeSwitch Team ${suffix}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Team name", exact: true }).fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(teamName)).toBeVisible();

  await page.getByText(teamName).click();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogAName }).click();
  await expect(page.getByText(`1. ${dogAName}`)).toBeVisible();
  await page.getByRole("combobox", { name: "Add dog" }).click();
  await page.getByRole("option", { name: dogBName }).click();
  await expect(page.getByText(`2. ${dogBName}`)).toBeVisible();

  await page.getByRole("button", { name: "Add lineup" }).click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Create" }).click();
  const teamCard = page.locator(".MuiCard-root", { hasText: teamName });
  await expect(teamCard.getByRole("heading", { level: 3 })).toContainText("Lineup");

  await page.goto("/trainer-panel/tasks");

  const description = `Mode switch task ${suffix}`;
  const addTaskButtons = page.getByText("Add task here");
  await expect(addTaskButtons.first()).toBeVisible();
  const count = await addTaskButtons.count();
  await addTaskButtons.nth(count - 2).click();
  await page
    .getByRole("combobox", { name: "Type or select task description" })
    .fill(description);
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: soloDogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  const taskCard = page.locator("[data-task-id]", { hasText: description });
  await expect(taskCard.getByText(soloDogName)).toBeVisible();

  // Reopen and switch modes - the previously-picked dog gets dropped, the
  // lineup's own two dogs take over.
  await page.getByText(description, { exact: true }).click();
  await page.getByRole("button", { name: "Team lineup" }).click();
  await page.getByRole("combobox", { name: "Team", exact: true }).click();
  await page.getByRole("option", { name: teamName }).click();
  await page.getByRole("combobox", { name: "Lineup", exact: true }).click();
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  await expect(taskCard.getByText(dogAName)).toBeVisible();
  await expect(taskCard.getByText(dogBName)).toBeVisible();
  await expect(taskCard.getByText(soloDogName)).not.toBeVisible();
});
