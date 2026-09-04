import React, { useState } from "react";
import { Box, Button, IconButton, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import { usePwaInstall } from "../hooks/usePwaInstall";

const PwaInstallBanner = () => {
  const { t } = useTranslation();
  const { isStandalone, isIos, canPromptInstall, promptInstall } = usePwaInstall();
  // Not persisted - comes back every visit until actually installed.
  const [dismissed, setDismissed] = useState(false);

  if (isStandalone || dismissed || !(canPromptInstall || isIos)) return null;

  return (
    <Paper
      elevation={4}
      sx={{
        position: "fixed",
        left: 8,
        right: 8,
        bottom: 8,
        zIndex: (theme) => theme.zIndex.snackbar,
        maxWidth: 480,
        marginX: "auto",
        padding: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderRadius: 2,
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2">{t("pwaInstall.title")}</Typography>
        <Typography variant="body2" color="text.secondary">
          {isIos ? t("pwaInstall.iosHint") : t("pwaInstall.body")}
        </Typography>
      </Box>

      {canPromptInstall && (
        <Button variant="contained" size="small" onClick={promptInstall} sx={{ flexShrink: 0 }}>
          {t("pwaInstall.action")}
        </Button>
      )}

      <IconButton size="small" onClick={() => setDismissed(true)} aria-label={t("pwaInstall.dismiss")}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};

export default PwaInstallBanner;
