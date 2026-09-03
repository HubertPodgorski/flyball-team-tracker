import { createFileRoute } from "@tanstack/react-router";
import Pitch from "../pages/Pitch";

export const Route = createFileRoute("/pitch")({
  component: Pitch,
});
