import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/super-admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/super-admin/users" });
  },
});
