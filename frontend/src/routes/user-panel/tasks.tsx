import { createFileRoute } from "@tanstack/react-router";
import Tasks from "../../pages/userPanel/Tasks";

export const Route = createFileRoute("/user-panel/tasks")({
  component: Tasks,
});
