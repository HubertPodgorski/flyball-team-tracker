import { createFileRoute } from "@tanstack/react-router";
import EventTemplates from "../../pages/adminPanel/EventTemplates";

export const Route = createFileRoute("/trainer-panel/event-templates")({
  component: EventTemplates,
});
