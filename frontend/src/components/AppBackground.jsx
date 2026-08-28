import React from "react";
import { Box } from "@mui/material";

// #08090b sampled directly from the splash image's own background - keeps
// the letterboxed edges (from backgroundSize: contain) seamless with it.
const AppBackground = ({ children }) => (
  <>
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: -2,
        background: "#08090b",
      }}
    />

    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        backgroundImage: "url(/splash-icon-1024.png)",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: "blur(10px)",
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

export default AppBackground;
