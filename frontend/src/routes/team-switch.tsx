import { createFileRoute } from "@tanstack/react-router";
import TeamSwitch from "../pages/superAdmin/TeamSwitch";

export const Route = createFileRoute("/team-switch")({
  component: TeamSwitch,
});
