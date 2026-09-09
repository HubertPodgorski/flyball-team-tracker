import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// "Download PDF" just triggers print - proves print mode actually renders a plain task-only sheet, board/nav hidden.
test("Download PDF switches to a print-only view of the task board, hiding the rest of the app", async ({ page }) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Print Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const dogName = `Print Dog ${Date.now()}`;
  await addDog(page, dogName);

  const description = `Print task ${Date.now()}`;

  await page.goto("/trainer-panel/tasks");
  await page.getByText("Add task here").first().click();
  await page.getByRole("combobox", { name: "Type or select task description" }).fill(description);
  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();
  // Two copies exist (editable board's + the always-mounted, still-hidden print view's) - .first() is the editable one.
  await expect(page.getByText(description, { exact: true }).first()).toBeVisible();
  await page.locator(".MuiDialog-container").waitFor({ state: "detached" });

  const downloadButton = page.getByRole("button", { name: "Download PDF" });
  const addTaskHere = page.getByText("Add task here").first();

  await expect(downloadButton).toBeVisible();
  await expect(addTaskHere).toBeVisible();

  // Mounts the (lazy) print view - window.print() itself is a no-op in this headless browser.
  await downloadButton.click();
  await page.emulateMedia({ media: "print" });

  const printArea = page.locator(".print-area");

  // The task itself survives into the printable copy...
  await expect(printArea.getByText(description, { exact: true })).toBeVisible();
  // ...but the editable drag board (only "Add task here" text there, never in the print view) does not.
  await expect(addTaskHere).toBeHidden();
  await expect(downloadButton).toBeHidden();

  await page.emulateMedia({ media: "screen" });
  await expect(downloadButton).toBeVisible();
});
