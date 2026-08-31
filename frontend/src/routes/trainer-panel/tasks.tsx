import { createFileRoute } from "@tanstack/react-router";
import AdminTasks from "../../pages/adminPanel/Tasks";

export const Route = createFileRoute("/trainer-panel/tasks")({
  component: AdminTasks,
});
