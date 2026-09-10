import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useIsSuperAdmin } from "../../hooks/useIsSuperAdmin";
import {
  useAdminClubsQuery,
  useCreateClubMutation,
  useDeleteClubMutation,
  useUpdateClubMutation,
} from "../../queries/clubs";
import { Club } from "../../helpers/clubsApi";

const emptyForm = { code: "", name: "" };

const Clubs = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const isSuperAdmin = useIsSuperAdmin();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { data: clubs = [] } = useAdminClubsQuery();
  const createMutation = useCreateClubMutation();
  const updateMutation = useUpdateClubMutation();
  const deleteMutation = useDeleteClubMutation();

  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<Club | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    if (!user || !isSuperAdmin) navigate({ to: "/login" });
  }, [user, isSuperAdmin, navigate]);

  if (!user || !isSuperAdmin) return null;

  const onCreate = () => {
    createMutation.mutate(
      { code: form.code.trim(), name: form.name.trim() },
      {
        onSuccess: () => setForm(emptyForm),
        onError: (error) => {
          const status = (error as { response?: { status?: number } }).response?.status;

          enqueueSnackbar(t(status === 409 ? "pages.superAdminClubs.codeTaken" : "pages.superAdminClubs.createFailed"), {
            variant: "error",
          });
        },
      }
    );
  };

  const closeDelete = () => {
    setToDelete(null);
    setConfirmCode("");
    setUnderstood(false);
  };

  const onConfirmDelete = () => {
    if (!toDelete) return;

    deleteMutation.mutate(toDelete._id, {
      onSuccess: () => {
        enqueueSnackbar(t("pages.superAdminClubs.deleted", { name: toDelete.name }), { variant: "success" });
        closeDelete();
      },
      onError: () => enqueueSnackbar(t("pages.superAdminClubs.createFailed"), { variant: "error" }),
    });
  };

  const canConfirmDelete = !!toDelete && understood && confirmCode.trim() === toDelete.code;
  const formValid = !!form.code.trim() && !!form.name.trim();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 720 }}>
      <Typography variant="h4">{t("pages.superAdminClubs.title")}</Typography>

      <Paper variant="outlined" sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="subtitle1">{t("pages.superAdminClubs.addClub")}</Typography>

        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1.5 }}>
          <TextField
            size="small"
            label={t("pages.superAdminClubs.codeLabel")}
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
          />
          <TextField
            size="small"
            label={t("pages.superAdminClubs.nameLabel")}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </Stack>

        <Button
          variant="contained"
          sx={{ alignSelf: "flex-start" }}
          disabled={!formValid}
          loading={createMutation.isPending}
          onClick={onCreate}
        >
          {t("pages.superAdminClubs.add")}
        </Button>
      </Paper>

      <Stack sx={{ gap: 1 }}>
        {clubs.map((club) => (
          <Paper
            key={club._id}
            variant="outlined"
            sx={{ padding: 1.5, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}
          >
            <Box sx={{ flexGrow: 1, minWidth: 180 }}>
              <Typography variant="body1">{club.name}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                {club.code} → {club.team}
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={club.suspended}
                  onChange={(event) =>
                    updateMutation.mutate({ _id: club._id, suspended: event.target.checked })
                  }
                />
              }
              label={t("pages.superAdminClubs.suspended")}
            />

            <IconButton color="error" onClick={() => setToDelete(club)} aria-label={t("pages.superAdminClubs.delete")}>
              <DeleteForeverIcon />
            </IconButton>
          </Paper>
        ))}
      </Stack>

      <Dialog open={!!toDelete} onClose={closeDelete} fullWidth maxWidth="xs">
        <DialogTitle>{t("pages.superAdminClubs.deleteTitle")}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="error">
            {t("pages.superAdminClubs.deleteWarning", { name: toDelete?.name ?? "" })}
          </Typography>

          <FormControlLabel
            control={<Checkbox checked={understood} onChange={(event) => setUnderstood(event.target.checked)} />}
            label={t("pages.superAdminClubs.understandCheckbox")}
          />

          <TextField
            size="small"
            label={t("pages.superAdminClubs.typeCodeToConfirm", { code: toDelete?.code ?? "" })}
            value={confirmCode}
            onChange={(event) => setConfirmCode(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete}>{t("common.cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!canConfirmDelete}
            loading={deleteMutation.isPending}
            onClick={onConfirmDelete}
          >
            {t("pages.superAdminClubs.confirmDelete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Clubs;
