import React from "react";
import { Box, useTheme } from "@mui/material";

// Deep Charcoal (#17191A) fallback fill from the brand palette doc, so any
// area the image's `cover` sizing doesn't reach still reads as "on brand"
// rather than plain black. Separate portrait/landscape crops of the same
// artwork, swapped by breakpoint, so the glow streaks read correctly on
// both phone and desktop aspect ratios.
const AppBackground = ({ children }) => {
  const theme = useTheme();

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -2,
          backgroundColor: "#17191A",
          backgroundImage: "url(/app-background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          [theme.breakpoints.up("md")]: {
            backgroundImage: "url(/app-background-wide.png)",
          },
        }}
      />

      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: "rgba(0, 0, 0, 0.35)",
        }}
      />

      {children}
    </>
  );
};

export default AppBackground;
