import React, { useState } from "react";
import { Box, Button, DialogActions, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { useDogsQuery } from "../../queries/dogs";
import { useCreateTeamMutation, useTeamsQuery } from "../../queries/teams";
import TeamCard from "../../components/teams/TeamCard";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import ClearableTextField from "../../components/inputs/ClearableTextField";

const Teams = () => {
  const { data: dogs = [] } = useDogsQuery();
  const { data: teams = [] } = useTeamsQuery();
  const createTeamMutation = useCreateTeamMutation();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");

  const onCreate = () => {
    if (!name.trim()) return;

    createTeamMutation.mutate(
      { name: name.trim(), dogs: [], matchups: [] },
      {
        onError: () =>
          enqueueSnackbar(t("pages.teams.saveFailed"), { variant: "error" }),
      }
    );
    setName("");
    setIsAddOpen(false);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          marginBottom: `${FAB_CONTENT_CLEARANCE}px`,
        }}
      >
        {teams.length === 0 && (
          <Typography color="text.secondary">{t("pages.teams.noTeamsYet")}</Typography>
        )}

        {teams.map((team) => (
          <TeamCard key={team._id} team={team} allDogs={dogs} editable />
        ))}
      </Box>

      <AddFab onClick={() => setIsAddOpen(true)} />

      <FormModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t("pages.teams.newTeam")}
      >
        <FormGrid>
          <ClearableTextField
            label={t("pages.teams.teamName")}
            value={name}
            onChange={setName}
            autoFocus
          />

          <DialogActions sx={{ padding: 0 }}>
            <Button size="medium" variant="outlined" onClick={() => setIsAddOpen(false)}>
              {t("common.cancel")}
            </Button>

            <Button size="medium" variant="contained" onClick={onCreate}>
              {t("common.create")}
            </Button>
          </DialogActions>
        </FormGrid>
      </FormModal>
    </>
  );
};

export default Teams;
