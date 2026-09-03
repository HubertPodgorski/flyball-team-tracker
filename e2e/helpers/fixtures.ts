import { test as base, expect } from "@playwright/test";

// The app defaults new/anonymous sessions to Polish (a deliberate product
// choice - see frontend/src/i18n/index.ts's getInitialLanguage), but every
// assertion in this suite is written against the English strings. Force
// English here, once, via a fixture override so it can't silently rot the
// whole suite again the next time someone touches an i18n default.
//
// This has to be an init script, not just a one-time storageState seed:
// page.goto() is a full navigation that re-executes the app bundle and
// re-reads localStorage's "user" key from scratch every time, and a real
// signup/login response overwrites that exact key with the account's real
// (Polish-default) language preference. addInitScript re-runs before every
// navigation in this page's lifetime, so it re-patches the language back to
// English each time, without touching the token/user data a real login just
// wrote there.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        const raw = window.localStorage.getItem("user");

        if (raw) {
          const parsed = JSON.parse(raw);

          parsed.user = { ...parsed.user, language: "en" };
          window.localStorage.setItem("user", JSON.stringify(parsed));
        } else {
          window.localStorage.setItem("user", JSON.stringify({ user: { language: "en" } }));
        }
      } catch {
        // Best-effort - a parse failure just leaves the (Polish) default.
      }
    });

    await use(page);
  },
});

export { expect };
