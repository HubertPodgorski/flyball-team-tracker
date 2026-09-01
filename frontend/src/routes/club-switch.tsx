import { createFileRoute } from "@tanstack/react-router";
import ClubSwitch from "../pages/superAdmin/ClubSwitch";

export const Route = createFileRoute("/club-switch")({
  component: ClubSwitch,
});
