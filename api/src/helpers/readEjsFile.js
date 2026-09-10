const fs = require("fs/promises");
const { readEjsSheet } = require("./xlsColors");
const { readXlsxSheet } = require("./xlsxColors");

const OLE2_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]); // legacy .xls (BIFF8)
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // .xlsx is a zip container

// Picks the reader by the file's actual header, not its extension - both yield the same { value, fill } row shape.
const readEjsFile = async (filePath) => {
  const handle = await fs.open(filePath, "r");

  let header;

  try {
    header = Buffer.alloc(4);
    await handle.read(header, 0, 4, 0);
  } finally {
    await handle.close();
  }

  if (header.equals(ZIP_SIGNATURE)) return readXlsxSheet(filePath);
  if (header.equals(OLE2_SIGNATURE)) return readEjsSheet(filePath);

  throw new Error("UNSUPPORTED_SPREADSHEET_FORMAT");
};

module.exports = { readEjsFile };
