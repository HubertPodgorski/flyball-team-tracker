import { createFileRoute, redirect } from "@tanstack/react-router";
import { userRoutes } from "../helpers/routesAndPaths";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: userRoutes.tasks });
  },
});
