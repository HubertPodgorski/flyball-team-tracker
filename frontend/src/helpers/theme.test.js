import { describe, expect, it } from "vitest";
import theme from "./theme";

describe("theme", () => {
  it("is dark mode", () => {
    expect(theme.palette.mode).toBe("dark");
  });
});
