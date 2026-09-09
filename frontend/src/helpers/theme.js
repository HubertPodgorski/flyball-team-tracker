import { alpha, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#FF8500",
      contrastText: "#f2f2f0",
    },
    secondary: {
      main: "#d96508",
      contrastText: "#b9bcbc",
    },
    // Was MUI's light-mode red (#d32f2f) - ~3:1 against this dark background, under WCAG AA's 4.5:1 floor.
    error: {
      main: "#e57373",
    },
    // Muted gold, not the standard MUI orange (#ed6c02) - that sat at
    // nearly the same brightness as success's green, barely distinguishable
    // on attendance buttons/chips (see calendar.js). Yellow/gold keeps a
    // real luminance gap from green without being as glaring as a pure
    // bright yellow on a solid-fill button.
    warning: {
      main: "#c9a227",
      contrastText: "#000000de",
    },
    info: {
      main: "#0288d1",
    },
    success: {
      main: "#2e7d32",
    },
    background: {
      default: "#17191a",
      paper: "#222526",
    },
    text: {
      primary: "#f2f2f0",
      secondary: "rgba(242, 242, 240, 0.6)",
    },
    action: {
      active: "rgba(242, 242, 240, 0.54)",
      hover: "rgba(242, 242, 240, 0.04)",
      selected: "rgba(242, 242, 240, 0.08)",
      disabled: "rgba(242, 242, 240, 0.26)",
      disabledBackground: "rgba(242, 242, 240, 0.12)",
      focus: "rgba(242, 242, 240, 0.12)",
    },
  },
  typography: {
    fontFamily: '"Albert Sans", "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    h1: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 300,
      fontSize: "6rem",
      lineHeight: 1.167,
      letterSpacing: "-0.01562em",
    },
    h2: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 300,
      fontSize: "3.75rem",
      lineHeight: 1.2,
      letterSpacing: "-0.00833em",
    },
    h3: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: "3rem",
      lineHeight: 1.167,
      letterSpacing: "0em",
    },
    h4: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: "2.125rem",
      lineHeight: 1.235,
      letterSpacing: "0.00735em",
    },
    h5: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: "1.5rem",
      lineHeight: 1.334,
      letterSpacing: "0em",
    },
    h6: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: "1.25rem",
      lineHeight: 1.6,
      letterSpacing: "0.0075em",
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    // Opaque by default - every other surface in the app is this same frosted-glass treatment (alpha + blur) over
    // the flashy background. Dark-mode color tokens live in index.css instead - DataGrid's own runtime <style> tag never sees these.
    MuiDataGrid: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.background.paper, 0.75),
          backdropFilter: "blur(6px)",
          borderRadius: 8,
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          minHeight: 40,
          paddingInline: 16,
        },
        outlined: {
          borderWidth: 1,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
        notchedOutline: {
          borderWidth: 1,
        },
      },
    },
    // Unifies every Select/TextField/FormControl to the same compact height project-wide.
    MuiFormControl: {
      defaultProps: {
        size: "small",
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 24,
          fontSize: 12,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          borderRadius: 4,
          minWidth: 24,
          height: 24,
          fontSize: 11,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          transform: "scale(1.00)",
          transformOrigin: "left center",
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          "& .MuiSvgIcon-root": {
            fontSize: 24,
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          "& .MuiSvgIcon-root": {
            fontSize: 24,
          },
        },
      },
    },
  },
});

export default theme;
