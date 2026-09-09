import { createTheme } from "@mui/material/styles";
import theme from "./theme";

// The app theme is permanently dark with hardcoded hexes (not mode-computed) - background/text/action need overriding too, not just `mode`.
const printTheme = createTheme(theme, {
  palette: {
    mode: "light",
    background: { default: "#ffffff", paper: "#ffffff" },
    text: { primary: "#141414", secondary: "#4a4a4a" },
    action: {
      active: "rgba(0, 0, 0, 0.54)",
      hover: "rgba(0, 0, 0, 0.04)",
      selected: "rgba(0, 0, 0, 0.08)",
      disabled: "rgba(0, 0, 0, 0.26)",
      disabledBackground: "rgba(0, 0, 0, 0.12)",
      focus: "rgba(0, 0, 0, 0.12)",
    },
  },
  components: {
    // A box-shadow barely survives printing/PDF export - a real border reads clearly on paper instead.
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "2px solid rgba(0, 0, 0, 0.3)",
        },
      },
    },
  },
});

export default printTheme;
