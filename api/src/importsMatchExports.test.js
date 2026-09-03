import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Regression test for a real incident: `lineupCascade.js`'s
// `removeDogsFromMatchups` was renamed to `keepOnlyPoolDogsInMatchups`, but
// its two callers (teamController.js, superAdminController.js) weren't
// updated - `node --check` is pure syntax checking, so it can't catch a
// destructure of a name that no longer exists on the required module (that
// silently yields `undefined`, only exploding when actually *called* at
// request time). This test statically walks every local `require(...)` in
// api/src and confirms every destructured name is really exported.
const srcDir = path.dirname(fileURLToPath(import.meta.url));

const walk = (dir) => {
  let files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(walk(full));
    } else if (entry.name.endsWith(".js") && !entry.name.endsWith(".test.js")) {
      files.push(full);
    }
  }

  return files;
};

const REQUIRE_RE = /const\s*{([^}]+)}\s*=\s*require\((['"])(\.[^'"]+)\2\)/g;

describe("local require() destructures match their module's actual exports", () => {
  const files = walk(srcDir);

  for (const file of files) {
    const relFile = path.relative(srcDir, file);
    const content = fs.readFileSync(file, "utf8");
    const matches = [...content.matchAll(REQUIRE_RE)];

    if (!matches.length) continue;

    it(`${relFile} imports resolve correctly`, () => {
      for (const match of matches) {
        const names = match[1]
          .split(",")
          .map((name) => name.trim().split(":")[0].trim())
          .filter(Boolean);
        const relImportPath = match[3];
        const resolved = path.resolve(path.dirname(file), relImportPath);

        // eslint-disable-next-line global-require, import/no-dynamic-require
        const mod = require(resolved);

        for (const name of names) {
          expect(
            name in mod,
            `${relFile} imports "${name}" from "${relImportPath}", but it isn't exported there (actual exports: ${Object.keys(mod).join(", ")})`
          ).toBe(true);
        }
      }
    });
  }
});
