import { describe, expect, it } from "vitest";
import { buildPushPayload } from "./pushI18n.js";

describe("buildPushPayload", () => {
  it("builds an English newEvent payload, carrying the event id through", () => {
    expect(buildPushPayload("en", "newEvent", "Training", "event-1")).toEqual({
      title: "New event",
      body: "Training",
      eventId: "event-1",
    });
  });

  it("builds a Polish newEvent payload", () => {
    expect(buildPushPayload("pl", "newEvent", "Trening", "event-1")).toEqual({
      title: "Nowe wydarzenie",
      body: "Trening",
      eventId: "event-1",
    });
  });

  it("builds an English attendanceReminder payload, naming the event in the body", () => {
    const payload = buildPushPayload("en", "attendanceReminder", "Training", "event-2");

    expect(payload.title).toBe("Attendance reminder");
    expect(payload.body).toContain("Training");
    expect(payload.eventId).toBe("event-2");
  });

  it("builds a Polish attendanceReminder payload", () => {
    const payload = buildPushPayload("pl", "attendanceReminder", "Trening", "event-2");

    expect(payload.title).toBe("Przypomnienie o obecności");
    expect(payload.body).toContain("Trening");
    expect(payload.eventId).toBe("event-2");
  });

  it("builds an English recurringEventsCreated payload, naming the count and event", () => {
    expect(buildPushPayload("en", "recurringEventsCreated", "Training", 6)).toEqual({
      title: "New events",
      body: "6 new Training sessions added",
    });
  });

  it("builds a Polish recurringEventsCreated payload", () => {
    expect(buildPushPayload("pl", "recurringEventsCreated", "Trening", 6)).toEqual({
      title: "Nowe wydarzenia",
      body: "Dodano 6 nowych sesji: Trening",
    });
  });

  it("falls back to Polish for an unrecognized language", () => {
    expect(buildPushPayload("fr", "newEvent", "Trening", "event-1")).toEqual({
      title: "Nowe wydarzenie",
      body: "Trening",
      eventId: "event-1",
    });
  });
});
