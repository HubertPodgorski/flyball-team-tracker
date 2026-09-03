import React from "react";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AppContextProvider } from "./contexts/AppContext";
import { router } from "./router";
import { queryClient } from "./queryClient";
import theme from "./helpers/theme";
import TasksContextBridge from "./components/TasksContextBridge";
import SseHandler from "./components/SseHandler";
import { AuthContextProvider } from "./contexts/AuthContext";
import { ConfirmProvider } from "material-ui-confirm";
import { SnackbarProvider } from "notistack";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { pl } from "date-fns/locale/pl";
import { enUS } from "date-fns/locale/en-US";
import { useTranslation } from "react-i18next";

const App = () => {
  const { i18n, t } = useTranslation();
  const dateLocale = i18n.language === "en" ? enUS : pl;

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3}>
        {/* useLegacyReturn: v4's confirm() otherwise never rejects on cancel.
            defaultOptions.title: material-ui-confirm's own default is the
            hardcoded English "Are you sure?" - neither useConfirmModal nor
            useConfirmModalSoft ever overrode it, so every confirm dialog
            showed that untranslated regardless of the selected language. */}
        <ConfirmProvider
          useLegacyReturn
          defaultOptions={{ title: t("confirm.title") }}
        >
          <QueryClientProvider client={queryClient}>
            <AuthContextProvider>
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={dateLocale}
              >
                <AppContextProvider>
                  <TasksContextBridge />
                  <SseHandler />

                  <CssBaseline />

                  <RouterProvider router={router} />
                </AppContextProvider>
              </LocalizationProvider>
            </AuthContextProvider>
          </QueryClientProvider>
        </ConfirmProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
