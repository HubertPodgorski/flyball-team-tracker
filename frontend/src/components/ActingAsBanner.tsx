import React from "react";
import { Box, Typography } from "@mui/material";
import { useIsSuperAdmin } from "../hooks/useIsSuperAdmin";
import { useCurrentTeam } from "../hooks/useCurrentTeam";

// Reminds a super-admin which team they're currently acting as.
const ActingAsBanner = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const currentTeam = useCurrentTeam();

  if (!isSuperAdmin || !currentTeam) return null;

  return (
    <Box
      sx={{
        backgroundColor: "warning.main",
        color: "warning.contrastText",
        textAlign: "center",
        padding: 0.5,
      }}
    >
      <Typography variant="caption">Acting as: {currentTeam}</Typography>
    </Box>
  );
};

export default ActingAsBanner;
