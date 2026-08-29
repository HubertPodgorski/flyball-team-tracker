import { createFileRoute } from "@tanstack/react-router";
import SuperAdminEvents from "../../pages/superAdmin/Events";

export const Route = createFileRoute("/super-admin/events")({
  component: SuperAdminEvents,
});
