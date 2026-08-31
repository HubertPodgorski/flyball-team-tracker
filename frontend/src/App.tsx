import React from "react";
import { RouterProvider } from "@tanstack/react-router";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AppContextProvider } from "./contexts/AppContext";
import { router } from "./router";
import theme from "./helpers/theme";
import SocketHandler from "./components/SocketHandler";
import { AuthContextProvider } from "./contexts/AuthContext";
import { ConfirmProvider } from "material-ui-confirm";
import { SnackbarProvider } from "notistack";
import { SocketContextProvider } from "./contexts/SocketContext.jsx";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { pl } from "date-fns/locale/pl";

const App = () => (
  <ThemeProvider theme={theme}>
    <SnackbarProvider maxSnack={3}>
      {/* useLegacyReturn: v4's confirm() otherwise never rejects on cancel. */}
      <ConfirmProvider useLegacyReturn>
        <AuthContextProvider>
          <SocketContextProvider>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={pl}
            >
              <AppContextProvider>
                <SocketHandler />

                <CssBaseline />

                <RouterProvider router={router} />
              </AppContextProvider>
            </LocalizationProvider>
          </SocketContextProvider>
        </AuthContextProvider>
      </ConfirmProvider>
    </SnackbarProvider>
  </ThemeProvider>
);

export default App;
