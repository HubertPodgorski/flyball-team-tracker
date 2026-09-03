import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

// Every delete confirm in this app is tested elsewhere for the "confirm"
// path - never for backing out of one. Two different confirm variants exist
// (useConfirmModal's "No thanks", useConfirmModalSoft's "Cancel") - one of
// each, confirming the target survives untouched. Regression coverage for a
// real bug this surfaced: 5 of 8 onDeleteClick handlers (Dogs, Users, Events,
// DogTasks, EventTemplates) called `await confirm()` with no try/catch -
// clicking cancel rejects that promise, and with nothing to catch it,
// every one of those pages threw an unhandled promise rejection on cancel.
test("backing out of a delete confirmation (either variant) leaves the data untouched", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  // pageerror alone isn't a reliable signal for this specific bug class -
  // the dev overlay reports an unhandled promise rejection to the console,
  // not necessarily as a page error event.
  page.on("console", (msg) => {
    if (msg.type() === "error" && /unhandled rejection/i.test(msg.text())) {
      pageErrors.push(msg.text());
    }
  });

  const email = uniqueEmail("trainer");
  const trainerName = `E2E Cancel Trainer ${Date.now()}`;

  await signupAndLoginAsTrainer(page, { email, name: trainerName, teamCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const suffix = Date.now();
  const dogName = `Cancel Dog ${suffix}`;
  await addDog(page, dogName);

  // useConfirmModal ("Delete forever" / "No thanks") - dog delete.
  const dogCard = page.locator(".MuiCard-root", { hasText: dogName });
  await dogCard.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "No thanks" }).click();
  await expect(page.getByText(dogName, { exact: true })).toBeVisible();

  // Same variant, same fix, on the Users, Events, and DogTasks pages.
  await page.goto("/trainer-panel/users");
  const trainerCard = page.locator(".MuiCard-root", { hasText: trainerName });
  await trainerCard.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "No thanks" }).click();
  await expect(page.getByText(trainerName, { exact: true })).toBeVisible();

  const eventName = `Cancel Event ${suffix}`;
  await page.goto("/trainer-panel/events");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(eventName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(eventName)).toBeVisible();
  const eventCard = page.locator(".MuiCard-root", { hasText: eventName });
  await eventCard.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "No thanks" }).click();
  await expect(page.getByText(eventName)).toBeVisible();

  const dogTaskName = `Cancel DogTask ${suffix}`;
  await page.goto("/trainer-panel/dog-tasks");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Task name", exact: true }).fill(dogTaskName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(dogTaskName, { exact: true })).toBeVisible();
  const dogTaskCard = page.locator(".MuiCard-root", { hasText: dogTaskName });
  await dogTaskCard.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "No thanks" }).click();
  await expect(page.getByText(dogTaskName, { exact: true })).toBeVisible();

  // useConfirmModalSoft ("Remove" / "Cancel") - lineup delete.
  const dogAName = `Cancel Lead ${suffix}`;
  const dogBName = `Cancel Follow ${suffix}`;

  await addDog(page, dogAName);
  await addDog(page, dogBName);

  await page.goto("/trainer-panel/teams");

  const teamName = `E2E Cancel Team ${suffix}`;

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
  const lineupHeading = teamCard.getByRole("heading", { level: 3 });
  await expect(lineupHeading).toContainText("Lineup");

  await lineupHeading.click();
  const lineupNameField = page.getByRole("textbox", { name: "Lineup name" });
  const lineupAccordion = teamCard.locator(".MuiAccordion-root", { has: lineupNameField });
  await lineupAccordion.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(lineupHeading).toContainText("Lineup");

  expect(pageErrors).toEqual([]);
});
