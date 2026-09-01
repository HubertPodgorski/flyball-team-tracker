import { createFileRoute } from "@tanstack/react-router";
import Teams from "../../pages/superAdmin/Teams";

export const Route = createFileRoute("/super-admin/teams")({
  component: Teams,
});
