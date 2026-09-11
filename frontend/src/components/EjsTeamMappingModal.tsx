import React, { useEffect, useState } from "react";
import { Autocomplete, Button, DialogActions, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Modal from "./modals/Modal";
import { getCurrentClub } from "../helpers/authToken";
import {
  useAllTeamMappingsQuery,
  useGlobalTeamMappingQuery,
  useSetAdminTeamMappingMutation,
  useSetCompetitionTeamMappingMutation,
} from "../queries/competitions";

interface Props {
  open: boolean;
  onClose: () => void;
  isSuperAdmin: boolean;
}

// One modal, two roles: a trainer picks which EJS team names are their own club's; a super-admin can do that for any
// club (free text allowed - it's a grouping label, not a real account). Opens automatically for a club with none yet.
const EjsTeamMappingModal = ({ open, onClose, isSuperAdmin }: Props) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const globalQuery = useGlobalTeamMappingQuery(open && !isSuperAdmin);
  const adminQuery = useAllTeamMappingsQuery(open && isSuperAdmin);
  const setMine = useSetCompetitionTeamMappingMutation();
  const setAny = useSetAdminTeamMappingMutation();

  const teamNames = (isSuperAdmin ? adminQuery.data?.teamNames : globalQuery.data?.teamNames) ?? [];
  const mappings = (isSuperAdmin ? adminQuery.data?.mappings : globalQuery.data?.mappings) ?? {};
  const clubs = adminQuery.data?.clubs ?? [];
  const isLoading = isSuperAdmin ? adminQuery.isLoading : globalQuery.isLoading;

  const [clubValue, setClubValue] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const targetClub = isSuperAdmin ? clubValue.trim() : (getCurrentClub() ?? "");

  // Re-seed the checklist from the current mappings whenever the modal (re)opens or (super-admin) the target club changes.
  useEffect(() => {
    if (!open) return;

    setChecked(teamNames.filter((name) => mappings[name] === targetClub));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetClub, JSON.stringify(mappings)]);

  useEffect(() => {
    if (!open) setClubValue("");
  }, [open]);

  const clubLabelFor = (team: string) => clubs.find((club) => club.team === team)?.name ?? team;

  const onSave = () => {
    if (!targetClub) return;

    const onSuccess = () => {
      enqueueSnackbar(t("pages.ejsStats.mapTeamsSaved"), { variant: "success" });
      onClose();
    };
    const onError = (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;

      enqueueSnackbar(
        status === 409 ? t("pages.ejsStats.mapTeamsConflict") : t("pages.ejsStats.mapTeamsFailed"),
        { variant: "error" }
      );
    };

    if (isSuperAdmin) setAny.mutate({ club: targetClub, ejsTeamNames: checked }, { onSuccess, onError });
    else setMine.mutate(checked, { onSuccess, onError });
  };

  const saving = setMine.isPending || setAny.isPending;

  return (
    <Modal open={open} onClose={onClose} title={t("pages.ejsStats.mapTeamsTitle")}>
      <Stack sx={{ gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {isSuperAdmin ? t("pages.ejsStats.mapTeamsHintAdmin") : t("pages.ejsStats.mapTeamsHint")}
        </Typography>

        {isSuperAdmin && (
          <Autocomplete
            // No autoSelect: with string options + a display getOptionLabel, its on-blur re-match commits the
            // *label* text ("Test") instead of the picked option ("TEST_TEAM") - freeSolo alone still lets a
            // typed club through (confirmed with Enter), and a clicked suggestion always keeps its real value.
            freeSolo
            options={clubs.map((club) => club.team)}
            getOptionLabel={clubLabelFor}
            value={clubValue || null}
            onChange={(_event, newValue) => setClubValue(newValue ?? "")}
            renderInput={(params) => <TextField {...params} label={t("pages.ejsStats.mapTeamsClub")} size="small" />}
          />
        )}

        <Autocomplete
          multiple
          // Without this, MUI closes the listbox after every single pick - the very next Escape (meant to just
          // dismiss it) then has nothing left to close but the dialog itself, and the whole modal vanishes.
          disableCloseOnSelect
          disabled={isSuperAdmin && !targetClub}
          loading={isLoading}
          options={teamNames}
          value={checked}
          onChange={(_event, newValue) => setChecked(newValue)}
          getOptionDisabled={(name) => !isSuperAdmin && !!mappings[name] && mappings[name] !== targetClub}
          renderOption={(props, name) => {
            const owner = mappings[name];
            const takenByOther = owner && owner !== targetClub;

            return (
              <li {...props} key={name}>
                {name}
                {takenByOther && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({clubLabelFor(owner)})
                  </Typography>
                )}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("pages.ejsStats.mapTeamsTeams")}
              placeholder={t("pages.ejsStats.mapTeamsTeamsPlaceholder")}
            />
          )}
        />
      </Stack>

      <DialogActions sx={{ paddingX: 0 }}>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="contained" loading={saving} disabled={isSuperAdmin && !targetClub} onClick={onSave}>
          {t("common.save")}
        </Button>
      </DialogActions>
    </Modal>
  );
};

export default EjsTeamMappingModal;
