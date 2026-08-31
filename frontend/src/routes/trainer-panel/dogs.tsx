import { createFileRoute } from "@tanstack/react-router";
import Dogs from "../../pages/adminPanel/Dogs";

export const Route = createFileRoute("/trainer-panel/dogs")({
  component: Dogs,
});
