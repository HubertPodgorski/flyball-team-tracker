import { describe, expect, it } from "vitest";
import { urlBase64ToUint8Array } from "./pushHelpers";

describe("urlBase64ToUint8Array", () => {
  it("decodes a base64url string with no padding needed", () => {
    // "AAECAw" (base64url) -> bytes [0, 1, 2, 3]
    expect(Array.from(urlBase64ToUint8Array("AAECAw"))).toEqual([0, 1, 2, 3]);
  });

  it("decodes a base64url string that needs both - and _ swapped back to + and /", () => {
    // Standard base64 "+/+/" (bytes [251, 255, 191]) becomes "-_-_" in base64url.
    expect(Array.from(urlBase64ToUint8Array("-_-_"))).toEqual([251, 255, 191]);
  });

  it("decodes an empty string to an empty array", () => {
    expect(Array.from(urlBase64ToUint8Array(""))).toEqual([]);
  });
});
