import { createFileRoute, redirect } from "@tanstack/react-router";
import { trainerRoutes } from "../../helpers/routesAndPaths";

export const Route = createFileRoute("/trainer-panel/")({
  beforeLoad: () => {
    throw redirect({ to: trainerRoutes.tasks });
  },
});
