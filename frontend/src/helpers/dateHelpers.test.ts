import { afterEach, describe, expect, it } from "vitest";
import i18next from "../i18n";
import { formatDate } from "./dateHelpers";

describe("formatDate", () => {
  afterEach(async () => {
    await i18next.changeLanguage("pl");
  });

  it("formats a date using the given pattern with the Polish locale", () => {
    expect(formatDate("2024-01-01T10:30:00", "dd/MM/yyyy HH:mm")).toBe(
      "01/01/2024 10:30"
    );
  });

  it("formats the weekday name in Polish", () => {
    // 2024-01-01 is a Monday.
    expect(formatDate("2024-01-01T10:30:00", "eeee")).toBe("poniedziałek");
  });

  it("accepts a Date instance as well as a string", () => {
    expect(formatDate(new Date("2024-01-01T10:30:00"), "dd/MM/yyyy")).toBe(
      "01/01/2024"
    );
  });

  it("switches to the English locale when i18next's active language is en", async () => {
    await i18next.changeLanguage("en");

    expect(formatDate("2024-01-01T10:30:00", "eeee")).toBe("Monday");
  });

  it("keeps numeric-only patterns identical regardless of language", async () => {
    await i18next.changeLanguage("en");

    expect(formatDate("2024-01-01T10:30:00", "dd/MM/yyyy HH:mm")).toBe(
      "01/01/2024 10:30"
    );
  });
});
