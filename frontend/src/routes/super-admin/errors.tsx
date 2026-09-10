import { createFileRoute } from "@tanstack/react-router";
import SuperAdminErrors from "../../pages/superAdmin/Errors";

export const Route = createFileRoute("/super-admin/errors")({
  component: SuperAdminErrors,
});
