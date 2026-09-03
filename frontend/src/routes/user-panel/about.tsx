import { createFileRoute } from "@tanstack/react-router";
import About from "../../pages/userPanel/About";

export const Route = createFileRoute("/user-panel/about")({
  component: About,
});
