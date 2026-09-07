import React, { useState } from "react";
import { Box, Button, IconButton, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useAuthContext } from "../hooks/useAuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { dismissPushPrompt, isPushPromptDismissed } from "../helpers/pushNotificationsPrompt";

// Shown once per device, not repeated - declining is permanent (see
// pushNotificationsPrompt.ts); Settings is the only way back in after that.
const PushNotificationBanner = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications();
  const { enqueueSnackbar } = useSnackbar();
  const [dismissed, setDismissed] = useState(isPushPromptDismissed);

  const onEnableClick = async () => {
    try {
      const granted = await subscribe();

      if (!granted) {
        enqueueSnackbar(t("settings.pushNotificationsDeniedHint"), { variant: "warning" });
      }
    } catch {
      enqueueSnackbar(t("settings.pushSubscribeFailed"), { variant: "error" });
    }
  };

  const onDismissClick = () => {
    dismissPushPrompt();
    setDismissed(true);
  };

  if (!user || !isSupported || isSubscribed || permission === "denied" || dismissed) {
    return null;
  }

  return (
    <Paper
      elevation={4}
      sx={{
        padding: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderRadius: 2,
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2">{t("pushNotificationsPrompt.title")}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t("pushNotificationsPrompt.body")}
        </Typography>
      </Box>

      <Button variant="contained" size="small" onClick={onEnableClick} sx={{ flexShrink: 0 }}>
        {t("pushNotificationsPrompt.action")}
      </Button>

      <IconButton
        size="small"
        onClick={onDismissClick}
        aria-label={t("pushNotificationsPrompt.dismiss")}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};

export default PushNotificationBanner;
