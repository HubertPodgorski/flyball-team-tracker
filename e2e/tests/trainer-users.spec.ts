import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

test("trainer can assign a dog to a teammate and remove them", async ({ page }) => {
  const trainerEmail = uniqueEmail("trainer");
  const teammateEmail = uniqueEmail("teammate");
  const teammateName = "E2E Teammate";

  await signupAndLoginAsTrainer(page, {
    email: trainerEmail,
    name: "E2E Trainer",
    teamCode: "TEST",
  });
  await promoteToTrainer(trainerEmail);
  await logout(page);
  await login(page, trainerEmail);

  const dogName = `Shared Dog ${Date.now()}`;
  await addDog(page, dogName);
  await logout(page);

  // A second, non-trainer user joins the same club.
  await signupAndLoginAsTrainer(page, {
    email: teammateEmail,
    name: teammateName,
    teamCode: "TEST",
  });
  await logout(page);

  await login(page, trainerEmail);
  await page.goto("/trainer-panel/users");

  await expect(page.getByText(teammateName, { exact: true })).toBeVisible();
  await page.getByText(teammateName, { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Editing user" })).toBeVisible();
  // Checked before making any change - a test that only ever adds to a
  // field can't tell a correctly prefilled form from a blank one (see
  // CrossPassModal.tsx's real bug, caught only by checking this).
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(
    teammateName
  );

  await page.getByRole("combobox", { name: "Dogs" }).click();
  await page.getByRole("option", { name: dogName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();

  const teammateCard = page.locator(".MuiCard-root", { hasText: teammateName });
  await expect(teammateCard.getByText(dogName)).toBeVisible();

  // Reopen once more - the just-assigned dog must show as a prefilled chip
  // in the Dogs field, not just visible on the card's own summary (the card
  // stays rendered behind the dialog, so this is scoped to the dialog).
  await page.getByText(teammateName, { exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText(dogName, { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  await teammateCard.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(teammateName, { exact: true })).not.toBeVisible();
});

test("trainer can reset a teammate's password when they're locked out", async ({ page }) => {
  // A full reset-and-relogin round trip needs more than the default budget.
  test.slow();

  const trainerEmail = uniqueEmail("trainer");
  const teammateEmail = uniqueEmail("teammate");
  const teammateName = `E2E Locked Out ${Date.now()}`;

  await signupAndLoginAsTrainer(page, {
    email: trainerEmail,
    name: "E2E Reset Trainer",
    teamCode: "TEST",
  });
  await promoteToTrainer(trainerEmail);
  await logout(page);

  await signupAndLoginAsTrainer(page, {
    email: teammateEmail,
    name: teammateName,
    teamCode: "TEST",
  });
  await logout(page);

  await login(page, trainerEmail);
  await page.goto("/trainer-panel/users");
  await page.getByText(teammateName, { exact: true }).click();

  await page.getByRole("button", { name: "Reset password" }).click();
  await page.getByRole("button", { name: "Remove" }).click();

  const temporaryPasswordField = page.getByRole("textbox", { name: "Password" });
  await expect(temporaryPasswordField).toBeVisible();
  const temporaryPassword = await temporaryPasswordField.inputValue();
  expect(temporaryPassword.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await logout(page);

  // The teammate's original password ("password123", see auth.ts) no
  // longer works - only the returned temporary one does.
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(teammateEmail);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("alert")).toBeVisible();

  await page.getByRole("textbox", { name: "Password", exact: true }).fill(temporaryPassword);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/\/user-panel/);
});
