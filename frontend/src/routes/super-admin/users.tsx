import { createFileRoute } from "@tanstack/react-router";
import SuperAdminUsers from "../../pages/superAdmin/Users";

export const Route = createFileRoute("/super-admin/users")({
  component: SuperAdminUsers,
});
