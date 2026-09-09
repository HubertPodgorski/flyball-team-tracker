import { createFileRoute } from "@tanstack/react-router";
import EjsStats from "../../pages/adminPanel/EjsStats";

export const Route = createFileRoute("/trainer-panel/ejs-stats")({
  component: EjsStats,
});
