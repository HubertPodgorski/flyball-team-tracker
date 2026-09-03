import { createFileRoute } from "@tanstack/react-router";
import Settings from "../../pages/userPanel/Settings";

export const Route = createFileRoute("/user-panel/settings")({
  component: Settings,
});
