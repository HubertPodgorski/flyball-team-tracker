import { describe, expect, it } from "vitest";
import { competitionOptionLabel } from "./competitionOptionLabel";

describe("competitionOptionLabel", () => {
  it("appends a single date when there is no end date", () => {
    expect(competitionOptionLabel({ name: "Regionals", date: "2026-06-01", endDate: undefined })).toBe(
      "Regionals · 01/06/2026"
    );
  });

  it("appends a date range for a multi-day competition", () => {
    expect(competitionOptionLabel({ name: "Nationals", date: "2026-06-01", endDate: "2026-06-03" })).toBe(
      "Nationals · 01/06/2026 – 03/06/2026"
    );
  });
});
