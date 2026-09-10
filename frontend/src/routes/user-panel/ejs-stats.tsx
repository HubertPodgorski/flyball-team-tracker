import { createFileRoute } from "@tanstack/react-router";
import EjsStats from "../../pages/userPanel/EjsStats";

export const Route = createFileRoute("/user-panel/ejs-stats")({
  component: EjsStats,
});
