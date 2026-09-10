import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout, addDog } from "../helpers/auth";

test("user can add a note and a cross-pass to their own dog from My Dogs", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");
  const trainerName = `E2E MyDogs Trainer ${Date.now()}`;

  await signupAndLoginAsTrainer(page, { email, name: trainerName, clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const runnerName = `Runner ${Date.now()}`;
  const predecessorName = `Predecessor ${Date.now()}`;

  await addDog(page, runnerName);
  await addDog(page, predecessorName);

  // My Dogs only shows dogs actually assigned to this user - a newly created
  // dog isn't auto-assigned to its creator, so assign both to self first.
  await page.goto("/trainer-panel/users");
  await page.getByText(trainerName, { exact: true }).click();

  // Non-freeSolo multi-select - readOnly by design (PickListInput), so mobile never pops a keyboard.
  const dogsCombobox = page.getByRole("combobox", { name: "Dogs" });
  await expect(dogsCombobox).toHaveAttribute("readonly", "");

  await dogsCombobox.click();
  await page.getByRole("option", { name: runnerName }).click();
  await page.getByRole("option", { name: predecessorName }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Submit" }).click();

  // Confirm the assignment actually landed (fire-and-forget mutation, no
  // optimistic update in this app - see SseHandler.tsx) before navigating
  // away, otherwise the reload below can win the race against the
  // PATCH -> SSE -> localStorage sync and My Dogs renders as if empty.
  const trainerCard = page.locator(".MuiCard-root", { hasText: trainerName });
  await expect(trainerCard.getByText(runnerName)).toBeVisible();
  await expect(trainerCard.getByText(predecessorName)).toBeVisible();

  await page.goto("/user-panel/my-dogs");

  const runnerCard = page.locator(".MuiCard-root", { hasText: runnerName });

  // Notes is now a plain inline field (no button, no dialog) - fill it, blur to save.
  const noteText = `Loves the box turn ${Date.now()}`;
  const notesField = runnerCard.getByRole("textbox", { name: "Notes" });

  await notesField.fill(noteText);
  await notesField.blur();
  await expect(notesField).toHaveValue(noteText);

  // Regression: Card defaults to overflow: hidden, which clipped the Notes field's floating label.
  const cardOverflow = await runnerCard.evaluate((el) => getComputedStyle(el).overflow);
  expect(cardOverflow).not.toBe("hidden");

  // Confirm it actually persisted server-side, not just held in the field's own local state.
  await page.reload();
  await expect(runnerCard.getByRole("textbox", { name: "Notes" })).toHaveValue(noteText);

  // Cross-pass, behind the predecessor dog.
  await runnerCard.getByRole("button", { name: "Add cross pass" }).click();

  // Regression: "running on lights" OR "running on dog" is required.
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("This field is required")).toBeVisible();

  await page.getByRole("combobox", { name: "Running on dog" }).click();
  await page.getByRole("option", { name: predecessorName }).click();
  // Note is a freeSolo Autocomplete (combobox), not a plain textbox.
  await page.getByRole("combobox", { name: "Note", exact: true }).fill("Trails closely");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(runnerCard.getByText(predecessorName)).toBeVisible();
  await expect(runnerCard.getByText("Trails closely")).toBeVisible();

  // Delete the cross-pass - now via its own edit modal (tap the row), not an inline delete icon.
  await runnerCard.getByText("Trails closely").click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(runnerCard.getByText("Trails closely")).not.toBeVisible();

  // A second cross-pass, this time "running on lights" (no predecessor dog)
  // with a starting position of "16m - 1ft" - metre anchor, then the sign
  // toggle, then an offset. Regression: the "-" sign used to be dropped
  // whenever it was picked before an offset existed.
  await runnerCard.getByRole("button", { name: "Add cross pass" }).click();
  await page.getByRole("switch", { name: "Running on lights" }).click();
  await page.getByRole("combobox", { name: "Starting position", exact: true }).click();
  await page.getByRole("option", { name: "16m", exact: true }).click();
  await page.getByRole("button", { name: "−", exact: true }).click();
  await page.getByRole("combobox", { name: "Offset", exact: true }).click();
  await page.getByRole("option", { name: "1ft", exact: true }).click();
  await page.getByRole("combobox", { name: "Note", exact: true }).fill("Off the box");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(runnerCard.getByText("Lights")).toBeVisible();
  await expect(runnerCard.getByText("16m - 1ft")).toBeVisible();
  await expect(runnerCard.getByText("Off the box")).toBeVisible();

  // Edit that same cross-pass by tapping its row.
  await runnerCard.getByText("Off the box", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit cross pass" })).toBeVisible();

  // Regression coverage for a real bug: reopening a "running on lights"
  // cross-pass came up with every field blank, not the values just saved.
  // useForm's defaultValues (a frozen empty constant) disagreed with what
  // the reset effect set, and TanStack Form's own internal re-sync-to-
  // defaultValues effect fought it - specifically for runningOnLights,
  // whose default was always false, flipping it also mounts/unmounts the
  // "running on dog" field in the same render pass, and that combination
  // was enough to make the library re-sync right after the real reset and
  // stomp every field back to blank (see CrossPassModal.tsx's
  // getFormValues). A test that only fills over the existing value (like
  // this one, right below) can't tell a correctly-prefilled field from a
  // blank one - so check the actual prefilled values first.
  await expect(page.getByRole("switch", { name: "Running on lights" })).toBeChecked();
  await expect(
    page.getByRole("combobox", { name: "Starting position", exact: true })
  ).toHaveText("16m");
  // The sign and offset survived the round trip too.
  await expect(page.getByRole("button", { name: "−", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("combobox", { name: "Offset", exact: true })).toHaveText("1ft");
  await expect(page.getByRole("combobox", { name: "Note", exact: true })).toHaveValue(
    "Off the box"
  );

  await page.getByRole("combobox", { name: "Note", exact: true }).fill("Off the box, tighter");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(runnerCard.getByText("Off the box, tighter")).toBeVisible();
  await expect(runnerCard.getByText("Off the box", { exact: true })).not.toBeVisible();
});
