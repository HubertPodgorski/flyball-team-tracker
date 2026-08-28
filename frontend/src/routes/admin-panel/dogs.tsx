import { createFileRoute } from "@tanstack/react-router";
import Dogs from "../../pages/adminPanel/Dogs";

export const Route = createFileRoute("/admin-panel/dogs")({
  component: Dogs,
});
