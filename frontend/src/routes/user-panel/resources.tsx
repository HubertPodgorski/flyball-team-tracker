import { createFileRoute } from "@tanstack/react-router";
import Resources from "../../pages/userPanel/Resources";
import { resourcesQueryOptions } from "../../queries/resources";

export const Route = createFileRoute("/user-panel/resources")({
  loader: ({ context }) => context.queryClient.ensureQueryData(resourcesQueryOptions()),
  component: Resources,
});
