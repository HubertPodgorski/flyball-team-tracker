const { rgbEqual } = require("./xlsColors");

// [nameCol, changeoverCol, timeCol] per dog slot - matches the EJS export's fixed 4-dog layout.
const DOG_SLOT_COLUMNS = [[13, 14, 15], [16, 17, 18], [19, 20, 21], [22, 23, 24]];
const FIRST_EXTRA_COLUMN = 25;
const MIN_ROW_LENGTH = 8; // shorter rows are unplayed/bye slots, not a real heat
const FAULT_TEXT_CODES = new Set(["early", "obok"]); // "ok"/"OK"/"Ok" means clean, not a fault

// Each dog slot's fixed header fill color, read once per file - reruns are attributed by matching this, not by position.
const getSlotColors = (headerRow) => DOG_SLOT_COLUMNS.map(([nameCol]) => (headerRow[nameCol] && headerRow[nameCol].fill) || null);

const cellValue = (row, col) => (row[col] ? row[col].value : undefined);

const isFaultText = (value) => typeof value === "string" && FAULT_TEXT_CODES.has(value.trim().toLowerCase());

// "-" (no seed time yet), "NT", blank, etc. all show up in columns the export otherwise fills with real numbers - anything not already a number becomes null.
const numericOrNull = (value) => (typeof value === "number" ? value : null);

// Extra pairs are (marker, time) starting at FIRST_EXTRA_COLUMN - an uncolored pair continues whichever dog was most recently colored.
const parseExtraPasses = (row, slotColors) => {
  const extraPasses = [];
  let lastDogIndex = null;

  for (let col = FIRST_EXTRA_COLUMN; col + 1 < row.length; col += 2) {
    const time = cellValue(row, col + 1);

    if (time === undefined || time === "") continue;

    const fill = row[col] && row[col].fill;
    const coloredIndex = fill ? slotColors.findIndex((color) => rgbEqual(color, fill)) : -1;
    const dogIndex = coloredIndex >= 0 ? coloredIndex : lastDogIndex;

    if (dogIndex !== null) lastDogIndex = dogIndex;

    extraPasses.push({ time, dogIndex });
  }

  return extraPasses;
};

// Dog 1 times its own start against the box light (no dog to cross with yet); dogs 2-4 time it against the incoming dog (a real cross-pass).
const timingFieldName = (index) => (index === 0 ? "lightsTime" : "crossTime");

const parseDogs = (row, extraPasses) => {
  const rerunDogIndexes = new Set(extraPasses.map((pass) => pass.dogIndex).filter((index) => index !== null));

  return DOG_SLOT_COLUMNS.map(([nameCol, timingCol, timeCol], index) => {
    const name = cellValue(row, nameCol);
    const timing = cellValue(row, timingCol);
    const time = cellValue(row, timeCol) ?? null;

    return {
      name: name || null,
      runningOnLights: index === 0, // purely positional - true regardless of whether any dog here got matched to a club dog
      [timingFieldName(index)]: timing === undefined || timing === "" ? null : timing,
      time,
      // Fault text ("early"/"obok") can land in the dog-time column too, not just the changeover column.
      faulted: rerunDogIndexes.has(index) || isFaultText(timing) || isFaultText(time),
    };
  });
};

// One row -> one structured entry, or null for an unplayed/bye slot (too short to have a real result).
const parseRow = (row, slotColors) => {
  if (row.length < MIN_ROW_LENGTH) return null;

  const extraPasses = parseExtraPasses(row, slotColors);

  return {
    race: numericOrNull(cellValue(row, 0)),
    division: numericOrNull(cellValue(row, 1)),
    match: numericOrNull(cellValue(row, 2)),
    time: cellValue(row, 3),
    teamName: cellValue(row, 4),
    seedTime: numericOrNull(cellValue(row, 5)),
    seedNetTime: numericOrNull(cellValue(row, 6)),
    opponentName: cellValue(row, 7),
    teamTime: numericOrNull(cellValue(row, 8)),
    teamNetTime: numericOrNull(cellValue(row, 9)),
    resultFlag: cellValue(row, 10) || null,
    result: cellValue(row, 11) || null,
    jumpHeight: numericOrNull(cellValue(row, 12)),
    dogs: parseDogs(row, extraPasses),
    extraPasses,
  };
};

// rows[0] is a title/meta row, rows[1] is the column header (source of the per-slot colors), real data starts at rows[2].
const parseEjsRows = (rows) => {
  const slotColors = getSlotColors(rows[1] || []);

  return rows.slice(2).map((row) => parseRow(row, slotColors)).filter(Boolean);
};

module.exports = { parseEjsRows };
