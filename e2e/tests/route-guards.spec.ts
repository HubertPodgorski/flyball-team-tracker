import { test, expect } from "../helpers/fixtures";
import { uniqueEmail } from "../helpers/testData";
import { signupAndLoginAsTrainer } from "../helpers/auth";

// trainer-panel/route.tsx and super-admin/route.tsx both redirect to /login
// in a useEffect when the current user lacks the role - never actually
// exercised anywhere else, since every other test either promotes to
// trainer/super-admin first or never touches these routes as a plain user.
//
// The guard's own target (/login) is never actually a durable resting place
// for an already-authenticated user, though: LoginForm has its own
// useEffect that immediately bounces a logged-in `user` further on to
// userRoutes.tasks (see LoginForm.jsx). Both effects fire on essentially the
// same tick, so which URL a polling assertion happens to observe is a race
// with no guaranteed winner - asserting the transient /login value flaked
// depending on JS engine/bundle-load timing, not on anything actually
// broken. Assert the real contract instead: the guarded page's own content
// never renders, and the user lands somewhere that isn't it.
test("a plain, unpromoted user is bounced away from trainer-panel and super-admin routes", async ({
  page,
}) => {
  const email = uniqueEmail("plain-user");

  await signupAndLoginAsTrainer(page, { email, name: "E2E Plain User", teamCode: "TEST" });

  await page.goto("/trainer-panel/tasks");
  await expect(page).not.toHaveURL(/\/trainer-panel/);
  await expect(page.getByText("Add task here").first()).not.toBeVisible();

  await page.goto("/super-admin/users");
  await expect(page).not.toHaveURL(/\/super-admin/);

  // user-panel routes stay open - not role-gated, just needs to be logged in.
  await page.goto("/user-panel/my-dogs");
  await expect(page).toHaveURL(/\/user-panel\/my-dogs$/);
});
