const ExcelJS = require("exceljs");

// Standard Excel indexed-colour palette (the same 56 BIFF8 colours xlsColors.js uses, plus the fixed 0/1 black/white).
const INDEXED_PALETTE = [
  [0, 0, 0], [255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [255, 0, 255], [0, 255, 255],
  [0, 0, 0], [255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [255, 0, 255], [0, 255, 255],
  [128, 0, 0], [0, 128, 0], [0, 0, 128], [128, 128, 0], [128, 0, 128], [0, 128, 128], [192, 192, 192], [128, 128, 128],
  [153, 153, 255], [153, 51, 102], [255, 255, 204], [204, 255, 255], [102, 0, 102], [255, 128, 128], [0, 102, 204], [204, 204, 255],
  [0, 0, 128], [255, 0, 255], [255, 255, 0], [0, 255, 255], [128, 0, 128], [128, 0, 0], [0, 128, 128], [0, 0, 255],
  [0, 204, 255], [204, 255, 255], [204, 255, 204], [255, 255, 153], [153, 204, 255], [255, 153, 204], [204, 153, 255], [255, 204, 153],
  [51, 102, 255], [51, 204, 204], [153, 204, 0], [255, 204, 0], [255, 153, 0], [255, 102, 0], [102, 102, 153], [150, 150, 150],
  [0, 51, 102], [51, 153, 102], [0, 51, 0], [51, 51, 0], [153, 51, 0], [153, 51, 102], [51, 51, 153], [51, 51, 51],
];

const argbToRgb = (argb) => {
  const hex = argb.length === 8 ? argb.slice(2) : argb;

  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
};

// Only a solid pattern fill carries a fault flag - gradient/none read as no colour, same as the .xls path. Themed colours aren't resolved (an EJS export uses explicit RGB).
const fillColorOf = (cell) => {
  const fill = cell.fill;

  if (!fill || fill.type !== "pattern" || fill.pattern !== "solid") return null;

  const colour = fill.fgColor || {};

  if (typeof colour.argb === "string") return argbToRgb(colour.argb);
  if (typeof colour.indexed === "number") return INDEXED_PALETTE[colour.indexed] || null;

  return null;
};

// exceljs hands back rich text, formula results, hyperlinks and dates in a few shapes - flatten to the plain scalar the parser expects, with "" for blanks (matching readEjsSheet).
const cellValueOf = (cell) => {
  const value = cell.value;

  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if (value.richText) return value.richText.map((part) => part.text).join("");
    if ("result" in value) return value.result ?? "";
    if ("text" in value) return value.text ?? "";
    if ("hyperlink" in value) return value.text ?? value.hyperlink ?? "";
    return "";
  }

  return value;
};

const trimTrailingEmpty = (row) => {
  let end = row.length;

  while (end > 0 && row[end - 1].value === "") end--;

  return row.slice(0, end);
};

// Same { value, fill } row shape as readEjsSheet, for modern .xlsx exports.
const readXlsxSheet = async (filePath) => {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.worksheets[0];

  if (!sheet) throw new Error("NO_SHEET_IN_XLSX");

  const rows = [];

  for (let rowIndex = 1; rowIndex <= sheet.rowCount; rowIndex++) {
    const sheetRow = sheet.getRow(rowIndex);
    const row = [];

    for (let colIndex = 1; colIndex <= sheet.columnCount; colIndex++) {
      const cell = sheetRow.getCell(colIndex);

      row.push({ value: cellValueOf(cell), fill: fillColorOf(cell) });
    }

    rows.push(trimTrailingEmpty(row));
  }

  return rows;
};

module.exports = { readXlsxSheet };
