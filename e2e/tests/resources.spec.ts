import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { signupAndLoginAsTrainer } from "../helpers/auth";

test("a plain club member can create, edit, open, and delete a resource link", async ({
  page,
}) => {
  const email = uniqueEmail("member");
  // No promotion to trainer - any club member manages resources.
  await signupAndLoginAsTrainer(page, { email, name: "Resource Member", clubCode: "TEST" });

  // Shared club - other tests leave their own resources behind, so no
  // assumption about the list being empty at any point.
  await page.goto("/user-panel/resources");

  const name = `E2E Resource ${Date.now()}`;
  const editedName = `${name} Edited`;
  const url = "https://example.com/club-facebook";

  await page.getByRole("button", { name: "Add" }).click();

  // Rejected before it ever reaches the server.
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "URL", exact: true }).fill("not a url");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(
    page.getByText("Must look like a web address, e.g. facebook.com or https://example.com")
  ).toBeVisible();

  await page.getByRole("textbox", { name: "URL", exact: true }).fill(url);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByText(url, { exact: true })).toBeVisible();

  // Edit - via the pencil icon, not the card itself (that opens the link).
  const resourceCard = page.locator(".MuiCard-root", { hasText: name });
  await resourceCard.getByTestId("EditIcon").click();
  await expect(page.getByRole("heading", { name: "Editing resource" })).toBeVisible();
  // Checked before overwriting it below - a test that only ever fills over a
  // field can't tell a correctly prefilled form from a blank one.
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(name);
  await expect(page.getByRole("textbox", { name: "URL", exact: true })).toHaveValue(url);
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(editedName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(editedName, { exact: true })).toBeVisible();

  // The card itself opens the link in a new tab.
  const editedCard = page.locator(".MuiCard-root", { hasText: editedName });
  const [newPage] = await Promise.all([
    page.context().waitForEvent("page"),
    editedCard.click(),
  ]);
  await newPage.waitForLoadState();
  expect(newPage.url()).toBe(url);
  await newPage.close();

  await editedCard.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(editedName, { exact: true })).not.toBeVisible();
});

// Regression: a bare domain with no scheme (exactly what someone pastes from
// a browser's address bar) was accepted by validation, but as a plain <a
// href> it resolved relative to this app's own origin instead of leaving it -
// clicking "www.facebook.com" silently "opened" a page inside this app.
test("a resource link with no http(s):// scheme still opens the real external site", async ({
  page,
}) => {
  const email = uniqueEmail("member");
  await signupAndLoginAsTrainer(page, { email, name: "Bare Domain Member", clubCode: "TEST" });

  await page.goto("/user-panel/resources");

  const name = `E2E Bare Domain ${Date.now()}`;

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "URL", exact: true }).fill("example.com");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  const card = page.locator(".MuiCard-root", { hasText: name });
  const [newPage] = await Promise.all([page.context().waitForEvent("page"), card.click()]);
  await newPage.waitForLoadState();
  expect(newPage.url()).toMatch(/^https:\/\/example\.com\/?$/);
  await newPage.close();

  await card.getByTestId("DeleteIcon").click();
  await page.getByRole("button", { name: "Delete forever" }).click();
});
