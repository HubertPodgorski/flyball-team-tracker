import React, { useState } from "react";
import { Box, Button, DialogActions, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useAppContext } from "../../hooks/useAppContext";
import { useCreateTeamMutation, useTeamsQuery } from "../../queries/teams";
import TeamCard from "../../components/teams/TeamCard";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import ClearableTextField from "../../components/inputs/ClearableTextField";

const Teams = () => {
  const { dogs } = useAppContext();
  const { data: teams = [] } = useTeamsQuery();
  const createTeamMutation = useCreateTeamMutation();
  const { enqueueSnackbar } = useSnackbar();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");

  const onCreate = () => {
    if (!name.trim()) return;

    createTeamMutation.mutate(
      { name: name.trim(), dogs: [], matchups: [] },
      {
        onError: () => enqueueSnackbar("Failed to save", { variant: "error" }),
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
          <Typography color="text.secondary">No teams yet</Typography>
        )}

        {teams.map((team) => (
          <TeamCard key={team._id} team={team} allDogs={dogs} editable />
        ))}
      </Box>

      <AddFab onClick={() => setIsAddOpen(true)} />

      <FormModal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="New team">
        <FormGrid>
          <ClearableTextField
            label="Team name"
            value={name}
            onChange={setName}
            autoFocus
          />

          <DialogActions sx={{ padding: 0 }}>
            <Button size="medium" variant="outlined" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>

            <Button size="medium" variant="contained" onClick={onCreate}>
              Create
            </Button>
          </DialogActions>
        </FormGrid>
      </FormModal>
    </>
  );
};

export default Teams;
