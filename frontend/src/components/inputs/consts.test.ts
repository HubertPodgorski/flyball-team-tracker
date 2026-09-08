import { describe, expect, it, afterEach } from "vitest";
import i18next from "../../i18n";
import { EventType, getEventTypeOptions, getWeekdayOptions, WEEKDAYS } from "./consts";

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

describe("getWeekdayOptions", () => {
  afterEach(async () => {
    await i18next.changeLanguage("pl");
  });

  it("lists Monday-first with the value as its Date.getDay() code, in English", async () => {
    await i18next.changeLanguage("en");

    expect(getWeekdayOptions()).toEqual([
      { value: "1", label: "Mon" },
      { value: "2", label: "Tue" },
      { value: "3", label: "Wed" },
      { value: "4", label: "Thu" },
      { value: "5", label: "Fri" },
      { value: "6", label: "Sat" },
      { value: "0", label: "Sun" },
    ]);
  });

  it("labels in Polish when that's the active language", async () => {
    await i18next.changeLanguage("pl");

    expect(getWeekdayOptions().map((option) => option.label)).toEqual([
      "pon.",
      "wt.",
      "śr.",
      "czw.",
      "pt.",
      "sob.",
      "niedz.",
    ]);
  });

  it("WEEKDAYS matches Date.getDay()'s own weekday codes", () => {
    expect(new Set(WEEKDAYS)).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
  });
});
