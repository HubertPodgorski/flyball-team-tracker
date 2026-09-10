import { describe, expect, it, beforeAll, afterAll } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";
import ExcelJS from "exceljs";
import { readXlsxSheet } from "./xlsxColors.js";
import { readEjsFile } from "./readEjsFile.js";

const solidFill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

let fixturePath;

beforeAll(async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Drużyny");

  sheet.addRow(["title only"]);
  sheet.addRow(["Wyścig", "Dywizja", "Mecz", "Kiedy", "Kto"]);

  const dataRow = sheet.addRow([1, 3, 1, new Date("2026-06-13T09:00:00.000Z"), "Team A", "", "", "", "", "", "", "", "", "Goya"]);
  dataRow.getCell(14).fill = solidFill("FFFF0000"); // dog 1 name cell, red fill

  fixturePath = path.join(os.tmpdir(), `${crypto.randomUUID()}.xlsx`);
  await workbook.xlsx.writeFile(fixturePath);
});

afterAll(async () => {
  await fs.unlink(fixturePath).catch(() => {});
});

describe("readXlsxSheet", () => {
  it("returns the same { value, fill } row shape as the .xls reader, trailing blanks trimmed", async () => {
    const rows = await readXlsxSheet(fixturePath);

    expect(rows[1].map((cell) => cell.value)).toEqual(["Wyścig", "Dywizja", "Mecz", "Kiedy", "Kto"]);

    const dataRow = rows[2];
    expect(dataRow[0].value).toBe(1);
    expect(dataRow[3].value).toBeInstanceOf(Date);
    expect(dataRow[4].value).toBe("Team A");
    // Trailing empty cells (index 5-12) are trimmed; the last kept cell is the filled dog-name one.
    expect(dataRow).toHaveLength(14);
    expect(dataRow[13].value).toBe("Goya");
    expect(dataRow[13].fill).toEqual([255, 0, 0]);
    expect(dataRow[0].fill).toBeNull();
  });
});

describe("readEjsFile", () => {
  it("routes an .xlsx (zip) file to the xlsx reader", async () => {
    const rows = await readEjsFile(fixturePath);

    expect(rows[1].map((cell) => cell.value)).toContain("Wyścig");
  });

  it("rejects a file that is neither .xls nor .xlsx", async () => {
    const junkPath = path.join(os.tmpdir(), crypto.randomUUID());
    await fs.writeFile(junkPath, Buffer.from("plain text, no spreadsheet header"));

    try {
      await expect(readEjsFile(junkPath)).rejects.toThrow();
    } finally {
      await fs.unlink(junkPath);
    }
  });
});
