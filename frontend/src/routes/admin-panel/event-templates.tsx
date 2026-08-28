import { createFileRoute } from "@tanstack/react-router";
import EventTemplates from "../../pages/adminPanel/EventTemplates";

export const Route = createFileRoute("/admin-panel/event-templates")({
  component: EventTemplates,
});
