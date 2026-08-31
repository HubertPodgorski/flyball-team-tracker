import { createFileRoute } from "@tanstack/react-router";
import Events from "../../pages/adminPanel/Events";

export const Route = createFileRoute("/trainer-panel/events")({
  component: Events,
});
