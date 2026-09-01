import { createFileRoute } from "@tanstack/react-router";
import Teams from "../../pages/adminPanel/Teams";
import { teamsQueryOptions } from "../../queries/teams";

export const Route = createFileRoute("/trainer-panel/teams")({
  loader: ({ context }) => context.queryClient.ensureQueryData(teamsQueryOptions()),
  component: Teams,
});
