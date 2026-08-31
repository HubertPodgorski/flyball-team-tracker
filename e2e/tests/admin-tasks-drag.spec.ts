import { test, expect } from "@playwright/test";
import { uniqueEmail } from "../helpers/testData";
import { promoteToAdmin } from "../helpers/db";
import { signupAndLoginAsAdmin, login, logout } from "../helpers/auth";

// Regression test: the drag handle once collapsed to 0 height - drag twice to catch it.
test("admin can reorder task rows via drag and drop, more than once in a row", async ({
  page,
}) => {
  const email = uniqueEmail("admin");
  await signupAndLoginAsAdmin(page, {
    email,
    name: "E2E Admin",
    teamCode: "TEST",
  });
  await promoteToAdmin(email);
  await logout(page);
  await login(page, email);

  await page.goto("/admin-panel/tasks");

  // All e2e admins share one team - use unique names, not fixed indices.
  const suffix = Date.now();
  const taskA = `Box turn ${suffix}`;
  const taskB = `Passing ${suffix}`;

  const addTaskToNewTrailingRow = async (description: string) => {
    const addTaskButtons = page.getByText("Add task here");
    const count = await addTaskButtons.count();
    // Trailing empty row's first column is the second-to-last button.
    await addTaskButtons.nth(count - 2).click();
    await page
      .getByRole("combobox", { name: "Type or select task description" })
      .fill(description);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText(description)).toBeVisible();
    // Dialog container blocks pointer events until fully detached, not just faded.
    await page.locator(".MuiDialog-container").waitFor({ state: "detached" });
  };

  await addTaskToNewTrailingRow(taskA);
  await addTaskToNewTrailingRow(taskB);

  // Scoped to just these two tasks' relative order.
  const myTaskOrder = async () => {
    const all = await page.locator("h5").allTextContents();
    return all.filter((text) => text === taskA || text === taskB);
  };

  await expect.poll(myTaskOrder).toEqual([taskA, taskB]);

  // Walk up from the task's heading to its row, then down into its handle.
  const rowHandleFor = (description: string) =>
    page
      .getByText(description, { exact: true })
      .locator("xpath=ancestor::div[.//*[@data-row-handle]][1]//*[@data-row-handle]");

  const dragRowOnto = async (fromDescription: string, toDescription: string) => {
    const fromBox = await rowHandleFor(fromDescription).boundingBox();
    const toBox = await rowHandleFor(toDescription).boundingBox();

    if (!fromBox || !toBox) {
      throw new Error("Could not measure row drag handles");
    }

    const fromX = fromBox.x + fromBox.width / 2;
    const fromY = fromBox.y + fromBox.height / 2;
    const toX = toBox.x + toBox.width / 2;
    const toY = toBox.y + toBox.height / 2;

    await page.mouse.move(fromX, fromY);
    await page.mouse.down();
    // Paced small moves, not one jump - SortableJS needs time between them.
    const steps = 15;
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(
        fromX + ((toX - fromX) * i) / steps,
        fromY + ((toY - fromY) * i) / steps
      );
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(50);
    await page.mouse.up();
  };

  await dragRowOnto(taskA, taskB);
  await expect.poll(myTaskOrder).toEqual([taskB, taskA]);

  // The same gesture again, immediately - this is the part that broke.
  await dragRowOnto(taskB, taskA);
  await expect.poll(myTaskOrder).toEqual([taskA, taskB]);
});
