import { describe, expect, it } from "vitest";
import { formatValue, parseValue } from "./startingPosition";

describe("startingPosition formatValue", () => {
  it("drops the sign for a bare metre anchor", () => {
    expect(formatValue(16, "+", 0)).toBe("16m");
    expect(formatValue(16, "-", 0)).toBe("16m");
  });

  it("keeps the sign and offset label once an offset is chosen", () => {
    expect(formatValue(16, "-", 25)).toBe("16m - 25cm");
    expect(formatValue(16, "+", 30.48)).toBe("16m + 1ft");
  });
});

describe("startingPosition parseValue", () => {
  it("returns a null sign for a bare anchor so the picker keeps the user's manual choice", () => {
    expect(parseValue("16m")).toEqual({ meters: 16, sign: null, offsetCm: 0 });
  });

  it("reads the real sign back once there's an offset", () => {
    expect(parseValue("16m - 25cm")).toEqual({ meters: 16, sign: "-", offsetCm: 25 });
    expect(parseValue("16m + 1ft")).toEqual({ meters: 16, sign: "+", offsetCm: 30.48 });
  });

  it("round-trips a negative offset (the case the toggle used to lose)", () => {
    const parsed = parseValue("16m - 1ft")!;

    expect(formatValue(parsed.meters, parsed.sign ?? "+", parsed.offsetCm)).toBe("16m - 1ft");
  });

  it("tolerates commas, missing spaces and 'f' shorthand", () => {
    expect(parseValue("16m-1,5f")).toEqual({ meters: 16, sign: "-", offsetCm: 1.5 * 30.48 });
  });

  it("returns null for anything it can't read", () => {
    expect(parseValue("nonsense")).toBeNull();
    expect(parseValue("16m + 99ft")).toBeNull();
  });
});
