import { createFileRoute } from "@tanstack/react-router";
import Calendar from "../../pages/userPanel/Calendar";

export const Route = createFileRoute("/user-panel/calendar")({
  // eventId is set when arriving from a push notification click (see
  // serviceWorker.js) - Calendar.jsx scrolls to and highlights that event.
  validateSearch: (search: Record<string, unknown>) => ({
    eventId: typeof search.eventId === "string" ? search.eventId : undefined,
  }),
  component: Calendar,
});
