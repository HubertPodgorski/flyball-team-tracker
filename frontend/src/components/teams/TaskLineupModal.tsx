import React from "react";
import { Box, Button, DialogActions, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import FormModal from "../FormModal";
import DogChain from "./DogChain";
import LineupCrossPasses from "./LineupCrossPasses";
import { LinkedLineup, withLineupCrossPasses } from "../../helpers/lineupLink";
import { formatLineupLabel } from "../../helpers/lineup";
import { LineupCrossPass } from "../../helpers/types";
import { useUpdateTeamMutation } from "../../queries/teams";

interface Props {
  open: boolean;
  onClose: () => void;
  linked: LinkedLineup;
}

// Only cross-pass times/notes are editable here.
const TaskLineupModal = ({ open, onClose, linked }: Props) => {
  const { t } = useTranslation();
  const { team, lineup } = linked;
  const updateTeamMutation = useUpdateTeamMutation();

  const onCrossPassesChange = (crossPasses: LineupCrossPass[]) => {
    updateTeamMutation.mutate(withLineupCrossPasses(team, lineup._id, crossPasses));
  };

  return (
    <FormModal open={open} onClose={onClose} title={formatLineupLabel(lineup, t("pages.teams.lineupFallback"))}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {team.name}
        </Typography>

        <DogChain dogs={lineup.dogs} />

        <LineupCrossPasses lineup={lineup} editable onChange={onCrossPassesChange} />

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogActions>
      </Box>
    </FormModal>
  );
};

export default TaskLineupModal;
