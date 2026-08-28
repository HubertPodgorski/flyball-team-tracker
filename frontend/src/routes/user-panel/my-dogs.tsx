import { createFileRoute } from "@tanstack/react-router";
import MyDogs from "../../pages/userPanel/MyDogs";

export const Route = createFileRoute("/user-panel/my-dogs")({
  component: MyDogs,
});
