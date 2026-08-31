import { createFileRoute } from "@tanstack/react-router";
import DogTasks from "../../pages/adminPanel/DogTasks";

export const Route = createFileRoute("/trainer-panel/dog-tasks")({
  component: DogTasks,
});
