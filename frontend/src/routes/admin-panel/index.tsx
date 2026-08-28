import { createFileRoute, redirect } from "@tanstack/react-router";
import { adminRoutes } from "../../helpers/routesAndPaths";

export const Route = createFileRoute("/admin-panel/")({
  beforeLoad: () => {
    throw redirect({ to: adminRoutes.tasks });
  },
});
