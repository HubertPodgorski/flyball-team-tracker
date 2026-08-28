import React, { useEffect } from "react";
import { createRootRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Box } from "@mui/material";
import theme from "../helpers/theme";
import BottomNavBar from "../components/BottomNavBar";
import AppBackground from "../components/AppBackground";

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
      <Box
        sx={{
          padding: theme.spacing(2, 2, 9, 2),
          [theme.breakpoints.down("md")]: {
            gridGap: theme.spacing(1),
            padding: theme.spacing(1, 1, 9, 1),
          },
        }}
      >
        <Outlet />

        <BottomNavBar />
      </Box>
    </AppBackground>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
});
