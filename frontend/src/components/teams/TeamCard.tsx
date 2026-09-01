import React, { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Card,
  Collapse,
  Divider,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSnackbar } from "notistack";
import ClearableTextField from "../inputs/ClearableTextField";
import { Dog, Lineup, LineupCrossPass, Team } from "../../helpers/types";
import TeamDogsEditor from "./TeamDogsEditor";
import AddLineupModal from "./AddLineupModal";
import LineupAccordion from "./LineupAccordion";
import { useConfirmModal, useConfirmModalSoft } from "../../hooks/useConfirmModal";
import { LINEUP_MIN_DOGS } from "../../helpers/lineup";
import {
  useDeleteTeamMutation,
  useUpdateTeamMutation,
} from "../../queries/teams";

interface Props {
  team: Team;
  allDogs: Dog[];
  editable: boolean;
  // Super-admin passes club overrides instead of the defaults.
  onUpdate?: (team: Team, changes: Partial<Team>) => void;
  onDeleteTeam?: (team: Team) => void;
}

const TeamCard = ({
  team,
  allDogs,
  editable,
  onUpdate,
  onDeleteTeam,
}: Props) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const updateTeamMutation = useUpdateTeamMutation();
  const deleteTeamMutation = useDeleteTeamMutation();
  const confirm = useConfirmModal();
  const confirmSoft = useConfirmModalSoft();

  const updateTeam = (targetTeam: Team, changes: Partial<Team>) => {
    if (onUpdate) {
      onUpdate(targetTeam, changes);
      return;
    }

    updateTeamMutation.mutate(
      { ...targetTeam, ...changes, _id: targetTeam._id },
      {
        onError: () => enqueueSnackbar("Failed to save", { variant: "error" }),
      }
    );
  };

  const [expanded, setExpanded] = useState(false);
  const [isAddLineupOpen, setIsAddLineupOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(team.name);

  useEffect(() => {
    setNameDraft(team.name);
  }, [team.name]);

  const onRenameBlur = () => {
    if (nameDraft.trim() && nameDraft !== team.name) {
      updateTeam(team, { name: nameDraft.trim() });
    } else {
      setNameDraft(team.name);
    }
  };

  const onDogsChange = (dogs: Dog[]) => {
    updateTeam(team, { dogs });
  };

  const onCreateLineup = ({ name, dogs }: { name?: string; dogs: Dog[] }) => {
    const lineup = { name, dogs, crossPasses: [] } as unknown as Lineup;

    updateTeam(team, { matchups: [...team.matchups, lineup] });
  };

  const onLineupDogsChange = (lineupId: string, dogs: Dog[]) => {
    updateTeam(team, {
      matchups: team.matchups.map((lineup) =>
        lineup._id === lineupId ? { ...lineup, dogs } : lineup
      ),
    });
  };

  const onDeleteLineup = async (lineupId: string) => {
    try {
      await confirmSoft("Remove this lineup?");
    } catch {
      return;
    }

    updateTeam(team, {
      matchups: team.matchups.filter(({ _id }) => _id !== lineupId),
    });
  };

  const onLineupCrossPassesChange = (
    lineupId: string,
    crossPasses: LineupCrossPass[]
  ) => {
    updateTeam(team, {
      matchups: team.matchups.map((lineup) =>
        lineup._id === lineupId ? { ...lineup, crossPasses } : lineup
      ),
    });
  };

  const handleDeleteTeam = async () => {
    try {
      await confirm();
    } catch {
      return;
    }

    if (onDeleteTeam) {
      onDeleteTeam(team);
      return;
    }

    deleteTeamMutation.mutate(team._id, {
      onError: () => enqueueSnackbar("Failed to delete", { variant: "error" }),
    });
  };

  return (
    <Card
      sx={{
        padding: theme.spacing(2),
        backgroundColor: alpha(theme.palette.background.paper, 0.75),
        backdropFilter: "blur(6px)",
        [theme.breakpoints.down("md")]: {
          padding: theme.spacing(1),
        },
      }}
    >
      <Box
        onClick={() => setExpanded((previous) => !previous)}
        sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
      >
        <Typography variant="h5" sx={{ flexGrow: 1 }}>{team.name}</Typography>

        <Typography variant="body2" color="text.secondary">
          {team.dogs.length}/6 dogs
        </Typography>

        <IconButton
          size="small"
          sx={{ transform: expanded ? "rotate(180deg)" : "none" }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 2 }}>
          {editable && (
            <ClearableTextField
              label="Team name"
              value={nameDraft}
              onChange={setNameDraft}
              onBlur={onRenameBlur}
              size="small"
            />
          )}

          <Typography variant="subtitle2">Dogs</Typography>

          <TeamDogsEditor
            dogs={team.dogs}
            allDogs={allDogs}
            editable={editable}
            onChange={onDogsChange}
          />

          <Typography variant="subtitle2">Lineups</Typography>

          {team.matchups.length === 0 && (
            <Typography color="text.secondary">No lineups yet</Typography>
          )}

          {team.matchups.map((lineup, index) => (
            <React.Fragment key={lineup._id}>
              {index > 0 && <Divider />}

              <LineupAccordion
                lineup={lineup}
                editable={editable}
                onDelete={() => onDeleteLineup(lineup._id)}
                onSaveName={(name) =>
                  updateTeam(team, {
                    matchups: team.matchups.map((l) =>
                      l._id === lineup._id ? { ...l, name } : l
                    ),
                  })
                }
                onDogsChange={(dogs) => onLineupDogsChange(lineup._id, dogs)}
                onCrossPassesChange={(crossPasses) =>
                  onLineupCrossPassesChange(lineup._id, crossPasses)
                }
              />
            </React.Fragment>
          ))}

          {editable && (
            <Button
              startIcon={<AddIcon />}
              disabled={team.dogs.length < LINEUP_MIN_DOGS}
              onClick={() => setIsAddLineupOpen(true)}
              sx={{ alignSelf: "flex-start" }}
            >
              Add lineup
            </Button>
          )}

          {editable && (
            <Button color="error" onClick={handleDeleteTeam} sx={{ alignSelf: "flex-start" }}>
              Delete team
            </Button>
          )}
        </Box>
      </Collapse>

      {editable && (
        <AddLineupModal
          open={isAddLineupOpen}
          onClose={() => setIsAddLineupOpen(false)}
          dogs={team.dogs}
          onCreate={onCreateLineup}
        />
      )}
    </Card>
  );
};

export default TeamCard;
