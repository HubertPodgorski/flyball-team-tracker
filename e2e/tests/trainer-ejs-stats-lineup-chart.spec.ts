import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { promoteToTrainer, seedCompetitionWithLineups } from "../helpers/db";
import { signupAndLoginAsTrainer, login, logout } from "../helpers/auth";

// Regression: the chart used to get stuck at its 600px fallback width (squished left) if it first mounted empty.
test("the lineup-comparison chart fills the card's real width, not the 600px fallback", async ({ page }) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);

  // Re-login so the returned user object (and its roles) reflects the promotion - the trainer-panel route guard checks it.
  await logout(page);
  await login(page, email);

  const { teamName } = await seedCompetitionWithLineups("TEST_TEAM", `E2E Lineup Chart Comp ${Date.now()}`);

  await page.goto("/trainer-panel/ejs-stats");
  await page.getByRole("combobox", { name: "Competition" }).click();
  await page.getByRole("option", { name: new RegExp(`E2E Lineup Chart Comp`) }).click();

  await page.getByRole("button", { name: "Team", exact: true }).click();
  await page.getByRole("combobox", { name: "Team", exact: true }).click();
  await page.getByRole("option", { name: teamName, exact: true }).click();

  await page.getByRole("button", { name: "Lineups", exact: true }).click();

  // The title's immediate parent is exactly its own Card - the outer page Card also contains this text, ambiguously.
  const chartCard = page.getByRole("heading", { name: "Dog comparison", exact: true }).locator("..");
  const svg = chartCard.locator("svg").first();

  await expect(svg).toBeVisible();

  const [svgBox, cardBox] = await Promise.all([svg.boundingBox(), chartCard.boundingBox()]);

  expect(svgBox).not.toBeNull();
  expect(cardBox).not.toBeNull();

  // Stuck at the fallback the svg would be exactly 600px wide - assert it tracks the card's own width instead.
  expect(svgBox!.width).toBeGreaterThan(cardBox!.width - 80);
});

// Not just that the charts mount - that the numbers match a known fixture (see seedCompetitionWithLineups).
test("club stats reflect the seeded competition data - pass counts, fault rate, and outcome breakdown", async ({
  page,
}) => {
  const email = uniqueEmail("trainer");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Stats Trainer", clubCode: "TEST" });
  await promoteToTrainer(email);
  await logout(page);
  await login(page, email);

  const { dogAName, dogBName } = await seedCompetitionWithLineups(
    "TEST_TEAM",
    `E2E Stats Values Comp ${Date.now()}`
  );

  await page.goto("/trainer-panel/ejs-stats");
  await page.getByRole("combobox", { name: "Competition" }).click();
  await page.getByRole("option", { name: new RegExp("E2E Stats Values Comp") }).click();

  // Anchor on the dog-name text and read its own row (parent) - ".MuiStack-root" matches every nesting level.
  const passesCard = page.locator(".MuiCard-root.MuiPaper-outlined", { hasText: "Number of runs" });
  const dogARow = passesCard.getByText(dogAName, { exact: true }).locator("..");
  const dogBRow = passesCard.getByText(dogBName, { exact: true }).locator("..");

  await expect(dogARow.getByText("2", { exact: true })).toBeVisible();
  await expect(dogBRow.getByText("2", { exact: true })).toBeVisible();

  // Fault % card, only dogB faulted (50%) - scoped to the outlined per-column card, not the outer page Card.
  const faultCard = page.locator(".MuiCard-root.MuiPaper-outlined", { hasText: "Fault %" });
  const dogBFaultRow = faultCard.getByText(dogBName, { exact: true }).locator("..");

  await expect(dogBFaultRow.getByText("50%", { exact: true })).toBeVisible();

  // Outcome pie - 4 total passes club-wide: 1 fault, 1 "ok", 2 clean-numeric.
  const outcomeCard = page.locator(".MuiCard-root.MuiPaper-outlined", { hasText: "Pass outcomes" });

  await expect(outcomeCard.getByText("Fault - 25% (1)")).toBeVisible();
  await expect(outcomeCard.getByText("ok - 25% (1)")).toBeVisible();
  await expect(outcomeCard.getByText("Clean runs - 50% (2)")).toBeVisible();
  // Center total of the pie itself.
  await expect(outcomeCard.locator("svg text").filter({ hasText: "4" })).toBeVisible();
});
