import React, { useEffect } from "react";
import {
  createRootRouteWithContext,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Box } from "@mui/material";
import theme from "../helpers/theme";
import BottomNavBar from "../components/BottomNavBar";
import AppBackground from "../components/AppBackground";
import ActingAsBanner from "../components/ActingAsBanner";

export interface RouterContext {
  queryClient: QueryClient;
}

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/login" });
  }, [navigate]);

  return null;
};

const RootComponent = () => {
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("initial-location", JSON.stringify(location));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppBackground>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
        <ActingAsBanner />

        {/* Only this region scrolls - html/body/#root are pinned (see
            index.css) so the fixed BottomNavBar never drifts with content. */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: theme.spacing(2, 2, 7, 2),
            [theme.breakpoints.down("md")]: {
              gridGap: theme.spacing(1),
              padding: theme.spacing(1, 1, 7, 1),
            },
          }}
        >
          <Outlet />
        </Box>

        <BottomNavBar />
      </Box>
    </AppBackground>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
});
