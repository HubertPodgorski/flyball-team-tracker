import { createFileRoute } from "@tanstack/react-router";
import Teams from "../../pages/userPanel/Teams";
import { teamsQueryOptions } from "../../queries/teams";

export const Route = createFileRoute("/user-panel/teams")({
  loader: ({ context }) => context.queryClient.ensureQueryData(teamsQueryOptions()),
  component: Teams,
});
