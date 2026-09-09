import { describe, expect, it } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";
import { readEjsSheet, rgbEqual } from "./xlsColors.js";

const FIXTURE_PATH = path.join(__dirname, "..", "controllers", "fixtures", "ejs-sample.xls");

describe("readEjsSheet", () => {
  it("reads a real .xls file's rows and fill colors without crashing the process", async () => {
    const rows = await readEjsSheet(FIXTURE_PATH);

    expect(rows.length).toBeGreaterThan(2);
    expect(rows[1].map((cell) => cell.value)).toContain("Wyścig");
  });

  // Regression: a malformed file used to crash the whole process (a synchronous throw inside an fs callback, escaping normal try/catch).
  it("rejects a truncated/malformed .xls cleanly instead of crashing", async () => {
    const realBytes = await fs.readFile(FIXTURE_PATH);
    const truncatedPath = path.join(os.tmpdir(), crypto.randomUUID());

    await fs.writeFile(truncatedPath, realBytes.subarray(0, realBytes.length - 93));

    try {
      await expect(readEjsSheet(truncatedPath)).rejects.toThrow();
    } finally {
      await fs.unlink(truncatedPath);
    }
  });

  it("rejects a file that isn't an .xls at all (wrong magic bytes)", async () => {
    const notXlsPath = path.join(os.tmpdir(), crypto.randomUUID());

    await fs.writeFile(notXlsPath, Buffer.alloc(512, "not an xls file"));

    try {
      await expect(readEjsSheet(notXlsPath)).rejects.toThrow();
    } finally {
      await fs.unlink(notXlsPath);
    }
  });
});

describe("rgbEqual", () => {
  it("is true for identical rgb triples and false otherwise", () => {
    expect(rgbEqual([255, 0, 0], [255, 0, 0])).toBe(true);
    expect(rgbEqual([255, 0, 0], [0, 255, 0])).toBe(false);
    expect(rgbEqual(null, [255, 0, 0])).toBe(false);
  });
});
