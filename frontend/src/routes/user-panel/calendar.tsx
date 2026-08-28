import { createFileRoute } from "@tanstack/react-router";
import Calendar from "../../pages/userPanel/Calendar";

export const Route = createFileRoute("/user-panel/calendar")({
  component: Calendar,
});
