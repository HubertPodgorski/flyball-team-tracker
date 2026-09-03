import React from "react";
import { Box, Button, DialogActions, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import FormModal from "../FormModal";

interface Props {
  temporaryPassword: string | null;
  onClose: () => void;
}

// Shown once, right after a trainer/super-admin resets someone's password -
// there's no email flow (see Settings.tsx), so this is the only place the
// new password is ever visible. Nothing persists it in plain text anywhere.
const TemporaryPasswordDialog = ({ temporaryPassword, onClose }: Props) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword ?? "");
      enqueueSnackbar(t("modals.temporaryPassword.copied"), { variant: "success" });
    } catch {
      // Clipboard access can be unavailable (permissions, non-secure
      // context) - the password stays selectable in the field either way.
    }
  };

  return (
    <FormModal
      open={!!temporaryPassword}
      onClose={onClose}
      title={t("modals.temporaryPassword.title")}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t("modals.temporaryPassword.hint")}
        </Typography>

        <TextField
          label={t("common.password")}
          value={temporaryPassword ?? ""}
          slotProps={{ htmlInput: { readOnly: true, sx: { fontFamily: "monospace" } } }}
          onFocus={(event) => event.target.select()}
        />

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={onCopy}>
            {t("common.copy")}
          </Button>

          <Button size="medium" variant="contained" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogActions>
      </Box>
    </FormModal>
  );
};

export default TemporaryPasswordDialog;
