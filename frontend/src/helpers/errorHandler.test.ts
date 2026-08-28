import { describe, expect, it, vi } from "vitest";
import { Errors, handleError } from "./errorHandler";

describe("handleError", () => {
  it("calls the error handler with the mapped message when a known error is received", () => {
    const onErrorHandler = vi.fn();
    const onSuccessHandler = vi.fn();

    handleError(onErrorHandler, onSuccessHandler)(
      "TEMPLATE_WITH_NAME_ALREADY_EXISTS"
    );

    expect(onErrorHandler).toHaveBeenCalledWith(
      Errors.TEMPLATE_WITH_NAME_ALREADY_EXISTS
    );
    expect(onSuccessHandler).not.toHaveBeenCalled();
  });

  it("calls the success handler when nothing was received", () => {
    const onErrorHandler = vi.fn();
    const onSuccessHandler = vi.fn();

    handleError(onErrorHandler, onSuccessHandler)(undefined);

    expect(onSuccessHandler).toHaveBeenCalled();
    expect(onErrorHandler).not.toHaveBeenCalled();
  });

  it("calls the success handler when the received value isn't a known error", () => {
    const onErrorHandler = vi.fn();
    const onSuccessHandler = vi.fn();

    handleError(onErrorHandler, onSuccessHandler)("some_created_id");

    expect(onSuccessHandler).toHaveBeenCalled();
    expect(onErrorHandler).not.toHaveBeenCalled();
  });

  it("doesn't throw when no success handler was provided", () => {
    expect(() => handleError(vi.fn())("some_created_id")).not.toThrow();
  });
});
