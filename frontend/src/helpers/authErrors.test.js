import { describe, expect, it } from "vitest";
import i18next from "../i18n";
import { getAuthErrorMessage } from "./authErrors";

const t = i18next.getFixedT("en");

const withResponseError = (code) => ({ response: { data: { error: code } } });

describe("getAuthErrorMessage", () => {
  it("maps ALL_FIELDS_MUST_BE_FILLED to a human message", () => {
    expect(getAuthErrorMessage(withResponseError("ALL_FIELDS_MUST_BE_FILLED"), t)).toBe(
      "Please fill in all fields."
    );
  });

  it("maps INCORRECT_EMAIL to a human message", () => {
    expect(getAuthErrorMessage(withResponseError("INCORRECT_EMAIL"), t)).toBe(
      "No account found with that email."
    );
  });

  it("maps INCORRECT_PASSWORD to a human message", () => {
    expect(getAuthErrorMessage(withResponseError("INCORRECT_PASSWORD"), t)).toBe(
      "Incorrect password."
    );
  });

  it("maps EMAIL_ALREADY_IN_USE to a human message", () => {
    expect(getAuthErrorMessage(withResponseError("EMAIL_ALREADY_IN_USE"), t)).toBe(
      "An account with that email already exists."
    );
  });

  it("falls back to a network message when there is no response at all", () => {
    expect(getAuthErrorMessage({}, t)).toBe(
      "Can't reach the server. Check your connection and try again."
    );
    expect(getAuthErrorMessage(undefined, t)).toBe(
      "Can't reach the server. Check your connection and try again."
    );
  });

  it("falls back to a generic message for an unrecognized code with a response", () => {
    expect(getAuthErrorMessage(withResponseError("SOMETHING_NEW"), t)).toBe(
      "Something went wrong. Please try again."
    );
  });
});
