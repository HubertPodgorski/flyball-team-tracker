import { describe, expect, it } from "vitest";
import { percent, seconds, STAT_COLUMNS } from "./CompetitionStatsColumnCards";

describe("percent", () => {
  it("formats a fraction as a rounded whole-number percentage", () => {
    expect(percent(0.5)).toBe("50%");
    expect(percent(0.256)).toBe("26%");
  });

  it("renders the placeholder for null (no data)", () => {
    expect(percent(null)).toBe("–");
  });
});

describe("seconds", () => {
  it("formats a time to two decimal places", () => {
    expect(seconds(4.5)).toBe("4.50");
    expect(seconds(4.567)).toBe("4.57");
  });

  it("renders the placeholder for null (no data)", () => {
    expect(seconds(null)).toBe("–");
  });
});

describe("STAT_COLUMNS", () => {
  const row = {
    dogId: "1",
    name: "Rex",
    totalPasses: 4,
    faultCount: 1,
    faultRate: 0.25,
    cleanCount: 3,
    okCount: 1,
    okByText: { ok: 1 },
    okPercentOfAllPasses: 0.25,
    okPercentOfCleanPasses: 1 / 3,
    avgCrossTime: 4.3,
    avgLightsTime: 4.1,
    avgRunTime: 4.2,
  };

  it("effectiveness is non-faulty passes over all passes, not okPercentOfCleanPasses", () => {
    const effectivenessColumn = STAT_COLUMNS.find((column) => column.titleKey === "pages.ejsStats.columns.effectiveness")!;

    // (4 - 1) / 4 = 75%, not okPercentOfCleanPasses's 1/3.
    expect(effectivenessColumn.format(effectivenessColumn.value(row))).toBe("75%");
  });

  it("a row with zero passes has no effectiveness value, not a division-by-zero NaN", () => {
    const effectivenessColumn = STAT_COLUMNS.find((column) => column.titleKey === "pages.ejsStats.columns.effectiveness")!;

    expect(effectivenessColumn.value({ ...row, totalPasses: 0, faultCount: 0 })).toBeNull();
  });
});
