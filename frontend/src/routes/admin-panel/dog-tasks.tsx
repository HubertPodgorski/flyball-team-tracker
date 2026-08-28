import { createFileRoute } from "@tanstack/react-router";
import DogTasks from "../../pages/adminPanel/DogTasks";

export const Route = createFileRoute("/admin-panel/dog-tasks")({
  component: DogTasks,
});
