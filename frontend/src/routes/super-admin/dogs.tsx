import { createFileRoute } from "@tanstack/react-router";
import SuperAdminDogs from "../../pages/superAdmin/Dogs";

export const Route = createFileRoute("/super-admin/dogs")({
  component: SuperAdminDogs,
});
