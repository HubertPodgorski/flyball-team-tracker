import { describe, expect, it } from "vitest";
import { parseEjsRows } from "./ejsParser.js";

const RED = [255, 0, 0];
const CYAN = [0, 204, 255];
const YELLOW = [255, 255, 0];
const GREEN = [0, 255, 0];

const cell = (value, fill = null) => ({ value, fill });

// Matches the real header row's dog-slot column groups (13-15, 16-18, 19-21, 22-24), each with its own fixed fill color.
const HEADER_ROW = [
  cell("Wyścig"), cell("Dywizja"), cell("Mecz"), cell("Kiedy"), cell("Kto"), cell("Czas BO"), cell("CT BO"),
  cell("Z kim"), cell("Czas drużyny"), cell("CT netto"), cell(""), cell("W/P/R"), cell("Przeszkody"),
  cell("Imię psa", RED), cell("Dobieg", RED), cell("1.pies", RED),
  cell("Imię psa", CYAN), cell("Zmiana", CYAN), cell("2.pies", CYAN),
  cell("Imię psa", YELLOW), cell("Zmiana", YELLOW), cell("3.pies", YELLOW),
  cell("Imię psa", GREEN), cell("Zmiana", GREEN), cell("4.pies", GREEN),
];

// A clean, no-fault heat with all 4 dogs run once each.
const cleanRow = () => [
  cell(1), cell(5), cell(1), cell("08:35:33"), cell("Team A"), cell(17.5), cell(17.2),
  cell("Team B"), cell(18.39), cell(18.05), cell(""), cell("W"), cell(15),
  cell("Goya", RED), cell(0.15, RED), cell(4.01, RED),
  cell("Milka", CYAN), cell(0.2, CYAN), cell(4.51, CYAN),
  cell("Ramzes", YELLOW), cell("ok", YELLOW), cell(4.74, YELLOW),
  cell("Bajzel", GREEN), cell("OK", GREEN), cell(4.79, GREEN),
];

describe("parseEjsRows", () => {
  it("parses a clean 4-dog heat with no faults and no extra passes", () => {
    const [entry] = parseEjsRows([[], HEADER_ROW, cleanRow()]);

    expect(entry.race).toBe(1);
    expect(entry.teamName).toBe("Team A");
    expect(entry.opponentName).toBe("Team B");
    expect(entry.dogs.map((dog) => dog.name)).toEqual(["Goya", "Milka", "Ramzes", "Bajzel"]);
    expect(entry.dogs.every((dog) => !dog.faulted)).toBe(true);
    expect(entry.extraPasses).toEqual([]);
    expect(entry.dogs[0].lightsTime).toBe(0.15); // dog 1 only - timed against the start light, not a cross-pass
    expect(entry.dogs[1].crossTime).toBe(0.2); // dogs 2-4 - timed against the incoming dog
    expect(entry.dogs.map((dog) => dog.runningOnLights)).toEqual([true, false, false, false]);
  });

  // Regression: a real export had "-" (no seed time recorded yet) in seedTime/seedNetTime, which used to crash the whole import - Cast to Number failed.
  it("treats a '-' placeholder in a numeric column as null instead of crashing", () => {
    const row = cleanRow();

    row[5] = cell("-"); // seedTime
    row[6] = cell("-"); // seedNetTime

    const [entry] = parseEjsRows([[], HEADER_ROW, row]);

    expect(entry.seedTime).toBeNull();
    expect(entry.seedNetTime).toBeNull();
  });

  // Regression: a real export (Tczew 2026) had a garbled string in every "Kiedy" cell, which crashed the import - Cast to Date failed.
  it("keeps the entry time only when it is a real Date, nulling a garbled string", () => {
    const withDate = cleanRow();
    withDate[3] = cell(new Date("2026-06-13T09:00:00.000Z"));

    const garbled = cleanRow();
    garbled[3] = cell("3_:Tc:ze");

    expect(parseEjsRows([[], HEADER_ROW, withDate])[0].time).toEqual(new Date("2026-06-13T09:00:00.000Z"));
    expect(parseEjsRows([[], HEADER_ROW, garbled])[0].time).toBeNull();
  });

  it("drops unplayed/bye rows (fewer than 8 columns) instead of returning a broken entry", () => {
    const byeRow = [cell(3), cell(5), cell(1), cell("08:36:43"), cell("Team A"), cell(17.5), cell(17.2)];

    expect(parseEjsRows([[], HEADER_ROW, byeRow])).toEqual([]);
  });

  it("attributes a single colored rerun pair to the dog whose slot color it matches", () => {
    const row = cleanRow();

    row.push(cell("", YELLOW), cell(5.1, YELLOW)); // rerun colored like slot 3 (Ramzes)

    const [entry] = parseEjsRows([[], HEADER_ROW, row]);

    expect(entry.dogs[2].faulted).toBe(true); // Ramzes
    expect(entry.dogs.filter((dog) => dog.faulted)).toHaveLength(1);
    expect(entry.extraPasses).toEqual([{ time: 5.1, dogIndex: 2 }]);
  });

  it("attributes uncolored rerun pairs to whichever dog was most recently colored", () => {
    const row = cleanRow();

    row.push(cell("", GREEN), cell(8.73, GREEN)); // rerun 1: colored, slot 4 (Bajzel)
    row.push(cell(""), cell(4.87)); // rerun 2: uncolored - still Bajzel
    row.push(cell(""), cell(4.79)); // rerun 3: uncolored - still Bajzel

    const [entry] = parseEjsRows([[], HEADER_ROW, row]);

    expect(entry.dogs[3].faulted).toBe(true); // Bajzel
    expect(entry.dogs.filter((dog) => dog.faulted)).toHaveLength(1);
    expect(entry.extraPasses.map((pass) => pass.dogIndex)).toEqual([3, 3, 3]);
  });

  it("attributes each of two differently-colored reruns to its own dog", () => {
    const row = cleanRow();

    row.push(cell("", YELLOW), cell(8.73, YELLOW)); // rerun for slot 3 (Ramzes)
    row.push(cell("", GREEN), cell(4.87, GREEN)); // rerun for slot 4 (Bajzel)
    row.push(cell(""), cell(4.79)); // uncolored - continues slot 4 (Bajzel)

    const [entry] = parseEjsRows([[], HEADER_ROW, row]);

    expect(entry.dogs[2].faulted).toBe(true); // Ramzes
    expect(entry.dogs[3].faulted).toBe(true); // Bajzel
    expect(entry.extraPasses.map((pass) => pass.dogIndex)).toEqual([2, 3, 3]);
  });

  it("flags a dog faulted from an 'early' or 'obok' cross-time text code even with no rerun pair", () => {
    const row = cleanRow();

    row[20] = cell("early", YELLOW); // Ramzes' cross-time cell

    const [entry] = parseEjsRows([[], HEADER_ROW, row]);

    expect(entry.dogs[2].faulted).toBe(true);
    expect(entry.dogs[2].crossTime).toBe("early");
  });

  // Regression: a real export had the fault code in the dog-time column instead of (or as well as) the changeover column.
  it("flags a dog faulted from a fault text code in the dog-time column even with a clean changeover cell", () => {
    const row = cleanRow();

    row[21] = cell("obok"); // Ramzes' dog-time cell, changeover cell left clean

    const [entry] = parseEjsRows([[], HEADER_ROW, row]);

    expect(entry.dogs[2].faulted).toBe(true);
    expect(entry.dogs[2].time).toBe("obok");
  });

  it("does not treat 'ok'/'OK' cross-time text as a fault", () => {
    const [entry] = parseEjsRows([[], HEADER_ROW, cleanRow()]);

    expect(entry.dogs[2].crossTime).toBe("ok");
    expect(entry.dogs[3].crossTime).toBe("OK");
    expect(entry.dogs[2].faulted).toBe(false);
    expect(entry.dogs[3].faulted).toBe(false);
  });
});
