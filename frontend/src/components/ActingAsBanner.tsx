import React from "react";
import { Box, Typography } from "@mui/material";
import { useIsSuperAdmin } from "../hooks/useIsSuperAdmin";
import { useCurrentClub } from "../hooks/useCurrentClub";

// Reminds a super-admin which club they're currently acting as.
const ActingAsBanner = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const currentClub = useCurrentClub();

  if (!isSuperAdmin || !currentClub) return null;

  return (
    <Box
      sx={{
        backgroundColor: "warning.main",
        color: "warning.contrastText",
        textAlign: "center",
        padding: 0.5,
      }}
    >
      <Typography variant="caption">Acting as: {currentClub}</Typography>
    </Box>
  );
};

export default ActingAsBanner;
