import { createFileRoute } from "@tanstack/react-router";
import Features from "../../pages/adminPanel/Features";
import { clubSettingsQueryOptions } from "../../queries/clubSettings";

export const Route = createFileRoute("/trainer-panel/features")({
  loader: ({ context }) => context.queryClient.ensureQueryData(clubSettingsQueryOptions()),
  component: Features,
});
