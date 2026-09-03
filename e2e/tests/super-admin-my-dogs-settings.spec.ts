import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToSuperAdmin, promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// A super-admin has no dogs of their own, so Settings and My Dogs both
// swap the "my dogs" list for a manual Autocomplete pick of any club dog -
// a distinct branch from the regular per-user flow covered elsewhere.
test("super-admin picks an arbitrary club dog on Settings and My Dogs", async ({
  page,
}) => {
  const trainerEmail = uniqueEmail("trainer");
  const superAdminEmail = uniqueEmail("super-admin");

  const suffix = Date.now();
  const dogName = `SA Picked Dog ${suffix}`;

  await signupAndLoginAsTrainer(page, {
    email: trainerEmail,
    name: "E2E Trainer",
    teamCode: "TEST",
  });
  await promoteToTrainer(trainerEmail);
  await logout(page);
  await login(page, trainerEmail);
  await addDog(page, dogName);
  await logout(page);

  await signupAndLoginAsTrainer(page, {
    email: superAdminEmail,
    name: "E2E Super Admin",
    teamCode: "TEST",
  });
  await promoteToSuperAdmin(superAdminEmail);
  await logout(page);
  await login(page, superAdminEmail);

  await page.goto("/user-panel/settings");
  await page.getByRole("combobox", { name: "Dog", exact: true }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");

  await expect(
    page.getByRole("switch", { name: "Sync between lineups (same predecessor → same timing)" })
  ).toBeVisible();

  await page.goto("/user-panel/my-dogs");
  await page.getByRole("combobox", { name: "Dog", exact: true }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");

  const dogCard = page.locator(".MuiCard-root", { hasText: dogName });
  await expect(dogCard).toBeVisible();
  await expect(dogCard.getByText("Cross Passes")).toBeVisible();
});
