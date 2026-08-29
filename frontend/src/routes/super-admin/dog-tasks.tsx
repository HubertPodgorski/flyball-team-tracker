import { createFileRoute } from "@tanstack/react-router";
import SuperAdminDogTasks from "../../pages/superAdmin/DogTasks";

export const Route = createFileRoute("/super-admin/dog-tasks")({
  component: SuperAdminDogTasks,
});
