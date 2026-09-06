import { createFileRoute } from "@tanstack/react-router";
import SuperAdminResources from "../../pages/superAdmin/Resources";

export const Route = createFileRoute("/super-admin/resources")({
  component: SuperAdminResources,
});
