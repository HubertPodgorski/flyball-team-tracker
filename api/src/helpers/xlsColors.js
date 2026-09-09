const fs = require("fs/promises");
const xlrd = require("node-xlrd");

// CFB signature every real .xls (BIFF8) file starts with, and its container is always padded to a whole number of 512-byte sectors.
const CFB_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const SECTOR_SIZE = 512;

// node-xlrd's CFB parser throws on a malformed container in ways that escape normal try/catch (a synchronous throw inside an fs completion callback) and can crash the whole process - reject obviously-bad files before it ever gets a chance to.
const assertLooksLikeXls = async (filePath) => {
  const handle = await fs.open(filePath, "r");

  try {
    const { size } = await handle.stat();
    const header = Buffer.alloc(8);

    await handle.read(header, 0, 8, 0);

    if (size === 0 || size % SECTOR_SIZE !== 0 || !header.equals(CFB_SIGNATURE)) {
      throw new Error("NOT_A_VALID_XLS_FILE");
    }
  } finally {
    await handle.close();
  }
};

// node-xlrd never actually parses XF fill colors (see patches/node-xlrd+0.3.10.patch) - this file does it by walking the raw BIFF8 stream.
const XL_PALETTE = 0x92;
const XL_XF = 0xe0;

// Excel's default 56-color BIFF8 palette (indices 8-63) - overridden per-workbook by a PALETTE record when present.
const DEFAULT_PALETTE = [
  [0, 0, 0], [255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [255, 0, 255], [0, 255, 255],
  [128, 0, 0], [0, 128, 0], [0, 0, 128], [128, 128, 0], [128, 0, 128], [0, 128, 128], [192, 192, 192], [128, 128, 128],
  [153, 153, 255], [153, 51, 102], [255, 255, 204], [204, 255, 255], [102, 0, 102], [255, 128, 128], [0, 102, 204], [204, 204, 255],
  [0, 0, 128], [255, 0, 255], [255, 255, 0], [0, 255, 255], [128, 0, 128], [128, 0, 0], [0, 128, 128], [0, 0, 255],
  [0, 204, 255], [204, 255, 255], [204, 255, 204], [255, 255, 153], [153, 204, 255], [255, 153, 204], [204, 153, 255], [255, 204, 153],
  [51, 102, 255], [51, 204, 204], [153, 204, 0], [255, 204, 0], [255, 153, 0], [255, 102, 0], [102, 102, 153], [150, 150, 150],
  [0, 51, 102], [51, 153, 102], [0, 51, 0], [51, 51, 0], [153, 51, 0], [153, 51, 102], [51, 51, 153], [51, 51, 51],
];

// A strict sequential walk from offset 0 stays correctly aligned regardless of record content.
const walkRecords = (mem) => {
  const records = [];
  let pos = 0;

  while (pos + 4 <= mem.length) {
    const opcode = mem.readUInt16LE(pos);
    const length = mem.readUInt16LE(pos + 2);
    const dataStart = pos + 4;

    if (dataStart + length > mem.length) break;

    records.push({ opcode, data: mem.slice(dataStart, dataStart + length) });
    pos = dataStart + length;
  }

  return records;
};

// Fill colors indexed by XF index (matches sheet.cell.getXFIndex) - null where the XF has no fill.
const buildFillColorTable = (mem) => {
  const records = walkRecords(mem);
  let palette = null;
  const fills = [];

  const colorFromIndex = (index) => {
    if (index < 8 || index > 63) return null; // 0-7/64+ are fixed system colors, not relevant to fill highlighting here
    return (palette && palette[index - 8]) || DEFAULT_PALETTE[index - 8] || null;
  };

  for (const record of records) {
    if (record.opcode === XL_PALETTE) {
      const count = record.data.readUInt16LE(0);

      palette = [];

      for (let i = 0; i < count; i++) {
        const offset = 2 + i * 4;

        palette.push([record.data.readUInt8(offset), record.data.readUInt8(offset + 1), record.data.readUInt8(offset + 2)]);
      }
    } else if (record.opcode === XL_XF && record.data.length >= 20) {
      // BIFF8 XF record: fill pattern = bits 26-31 @ offset 14, foreground color index = bits 0-6 @ offset 18.
      const fillPattern = (record.data.readUInt32LE(14) >>> 26) & 0x3f;
      const fgColorIndex = record.data.readUInt16LE(18) & 0x7f;

      fills.push(fillPattern === 0 ? null : colorFromIndex(fgColorIndex));
    }
  }

  return fills;
};

const rgbEqual = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

// Empty cells read back as "" (never undefined/null) - trims those off the end so a row's length matches what a human would call "how many columns it uses".
const trimTrailingEmpty = (row) => {
  let end = row.length;

  while (end > 0 && row[end - 1].value === "") end--;

  return row.slice(0, end);
};

// One row = one array of { value, fill }, trimmed of trailing unused columns. Everything is read synchronously inside node-xlrd's callback - see the cleanUp() note above; nothing here can be deferred past an await.
const readEjsSheet = async (filePath) => {
  await assertLooksLikeXls(filePath);

  return new Promise((resolve, reject) => {
    xlrd.open(filePath, { formattingInfo: true }, (error, workbook) => {
      if (error) return reject(error);

      const fills = buildFillColorTable(workbook.mem);
      const sheet = workbook.sheet.byIndex(0);
      const rows = [];

      // getXFIndex can throw for a column with no COLINFO record at all - falls back to no fill, never worth failing the whole import over.
      const fillAt = (rowIndex, colIndex) => {
        try {
          return fills[sheet.cell.getXFIndex(rowIndex, colIndex)] || null;
        } catch {
          return null;
        }
      };

      for (let rowIndex = 0; rowIndex < sheet.row.count; rowIndex++) {
        const row = [];

        for (let colIndex = 0; colIndex < sheet.column.count; colIndex++) {
          row.push({ value: sheet.cell(rowIndex, colIndex), fill: fillAt(rowIndex, colIndex) });
        }

        rows.push(trimTrailingEmpty(row));
      }

      resolve(rows);
    });
  });
};

module.exports = { readEjsSheet, rgbEqual };
