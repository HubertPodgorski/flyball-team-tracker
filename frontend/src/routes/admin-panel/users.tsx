import { createFileRoute } from "@tanstack/react-router";
import Users from "../../pages/adminPanel/Users";

export const Route = createFileRoute("/admin-panel/users")({
  component: Users,
});
