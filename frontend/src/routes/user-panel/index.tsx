import { createFileRoute, redirect } from "@tanstack/react-router";
import { userRoutes } from "../../helpers/routesAndPaths";

export const Route = createFileRoute("/user-panel/")({
  beforeLoad: () => {
    throw redirect({ to: userRoutes.tasks });
  },
});
