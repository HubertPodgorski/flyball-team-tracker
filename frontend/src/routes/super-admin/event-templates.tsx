import { createFileRoute } from "@tanstack/react-router";
import SuperAdminEventTemplates from "../../pages/superAdmin/EventTemplates";

export const Route = createFileRoute("/super-admin/event-templates")({
  component: SuperAdminEventTemplates,
});
