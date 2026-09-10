import { formatDate } from "./dateHelpers";
import { Event } from "./types";

// "Regionals · 01/06/2026" (or a date range for a multi-day competition) - for the competition pickers.
export const competitionOptionLabel = (event: Pick<Event, "name" | "date" | "endDate">): string => {
  const start = formatDate(event.date, "dd/MM/yyyy");
  const range = event.endDate ? `${start} – ${formatDate(event.endDate, "dd/MM/yyyy")}` : start;

  return `${event.name} · ${range}`;
};
