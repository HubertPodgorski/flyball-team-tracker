import { useRef } from "react";

// A synchronous lock around a submit handler. `disabled={isPending}` alone
// can't stop a true back-to-back double-click: handleSubmit is async, so
// isPending doesn't flip until after an await inside it, by which point a
// second immediate click has already gone through. This locks on the first
// synchronous line instead, before any async work starts. Released via a
// microtask, so it can't unlock mid-double-click but still clears in time
// for two genuinely separate clicks (submit, reopen, submit again).
export const useSubmitGuard = () => {
  const lockedRef = useRef(false);

  return (fn) => {
    if (lockedRef.current) return;

    lockedRef.current = true;

    Promise.resolve(fn()).finally(() => {
      lockedRef.current = false;
    });
  };
};
