import { createFileRoute } from "@tanstack/react-router";
import SuperAdminClubs from "../../pages/superAdmin/Clubs";

export const Route = createFileRoute("/super-admin/clubs")({
  component: SuperAdminClubs,
});
