import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./queryClient";

export const router = createRouter({
  routeTree,
  context: { queryClient },
  // Prefetch loader data on link hover/focus, not just on click.
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
