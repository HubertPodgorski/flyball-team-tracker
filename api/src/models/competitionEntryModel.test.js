import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import "./competitionEntryModel.js";

const CompetitionEntryModel = mongoose.model("CompetitionEntry");

const baseEntry = (dogOverrides = {}) => ({
  eventId: new mongoose.Types.ObjectId(),
  teamName: "Team A",
  team: "TEST_TEAM",
  dogs: [{ name: "Rex", ...dogOverrides }],
});

describe("CompetitionEntry model", () => {
  // Regression: a real EJS export had "obok" (a fault text code) in the dog-time column, which used to crash the whole import - Cast to Number failed.
  it("accepts a text fault code in a dog's time field instead of throwing a cast error", () => {
    expect(() => new CompetitionEntryModel(baseEntry({ time: "obok" }))).not.toThrow();

    const entry = new CompetitionEntryModel(baseEntry({ time: "obok" }));
    expect(entry.dogs[0].time).toBe("obok");
  });

  it("still accepts a normal numeric dog time", () => {
    const entry = new CompetitionEntryModel(baseEntry({ time: 4.32 }));
    expect(entry.dogs[0].time).toBe(4.32);
  });

  it("accepts a text fault code in an extra pass's time field too", () => {
    const entry = new CompetitionEntryModel({ ...baseEntry(), extraPasses: [{ time: "obok", dogIndex: 1 }] });
    expect(entry.extraPasses[0].time).toBe("obok");
  });
});
