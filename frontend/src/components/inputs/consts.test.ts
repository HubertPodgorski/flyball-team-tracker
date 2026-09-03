import { describe, expect, it } from "vitest";
import i18next from "../../i18n";
import { EventType, getEventTypeOptions } from "./consts";

describe("getEventTypeOptions", () => {
  it("returns one translated option per event type in English", () => {
    const options = getEventTypeOptions(i18next.getFixedT("en"));

    expect(options).toEqual([
      { value: EventType.TRAINING, label: "Training" },
      { value: EventType.COMPETITION, label: "Competition" },
      { value: EventType.SEMINARY, label: "Seminary" },
      { value: EventType.MEETING, label: "Meeting" },
    ]);
  });

  it("returns one translated option per event type in Polish", () => {
    const options = getEventTypeOptions(i18next.getFixedT("pl"));

    expect(options).toEqual([
      { value: EventType.TRAINING, label: "Trening" },
      { value: EventType.COMPETITION, label: "Zawody" },
      { value: EventType.SEMINARY, label: "Seminarium" },
      { value: EventType.MEETING, label: "Zebranie" },
    ]);
  });
});
