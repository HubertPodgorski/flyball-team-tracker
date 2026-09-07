import React from "react";
import { Box } from "@mui/material";
import PwaInstallBanner from "./PwaInstallBanner";
import PushNotificationBanner from "./PushNotificationBanner";

// Single fixed-position container for every dismissible bottom banner, so
// two that happen to both apply (e.g. not installed yet AND not subscribed
// yet) stack in a column instead of overlapping at the same spot.
const BottomBanners = () => (
  <Box
    sx={{
      position: "fixed",
      left: 8,
      right: 8,
      bottom: 8,
      zIndex: (theme) => theme.zIndex.snackbar,
      maxWidth: 480,
      marginX: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 1,
    }}
  >
    <PwaInstallBanner />
    <PushNotificationBanner />
  </Box>
);

export default BottomBanners;
