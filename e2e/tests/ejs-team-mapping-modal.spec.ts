import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { signupAndLoginAsTrainer } from "../helpers/auth";

// A trainer's mapping modal has no club field - only a super-admin can pick an arbitrary club (see ejs-import-wizard.spec.ts
// for that path, which also covers the regression where selecting a team name used to close the whole dialog).
test("a trainer's team-mapping modal has no club field and cancels cleanly", async ({ page }) => {
  const email = uniqueEmail("user");
  await signupAndLoginAsTrainer(page, { email, name: "E2E Mapping User", clubCode: "TEST" });

  await page.goto("/user-panel/ejs-stats");
  await page.getByRole("button", { name: "Choose club's teams" }).click();

  const dialog = page.getByRole("dialog").filter({ hasText: "Choose club's EJS teams" });
  await expect(dialog.getByRole("combobox", { name: "Club" })).toHaveCount(0);
  await expect(dialog.getByRole("combobox", { name: "Team names" })).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
