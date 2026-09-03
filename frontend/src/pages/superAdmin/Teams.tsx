import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import TeamCard from "../../components/teams/TeamCard";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import ClearableTextField from "../../components/inputs/ClearableTextField";
import { CLUBS } from "../../helpers/teams";
import {
  createSuperAdminItem,
  deleteSuperAdminItem,
  fetchSuperAdminList,
  updateSuperAdminItem,
} from "../../helpers/superAdminApi";
import { Dog, Team } from "../../helpers/types";

const SuperAdminTeams = () => {
  const [club, setClub] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const load = async () => {
    if (!club) {
      setTeams([]);
      setDogs([]);
      return;
    }

    setLoading(true);

    try {
      const [teamsData, dogsData] = await Promise.all([
        fetchSuperAdminList("teams", club),
        fetchSuperAdminList("dogs", club),
      ]);

      setTeams(teamsData);
      setDogs(dogsData);
    } catch {
      enqueueSnackbar(t("pages.teams.loadFailed"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club]);

  const onCreate = async () => {
    if (!name.trim()) return;

    try {
      await createSuperAdminItem("teams", {
        name: name.trim(),
        dogs: [],
        matchups: [],
        team: club,
      });
    } catch {
      enqueueSnackbar(t("pages.teams.saveFailed"), { variant: "error" });
      return;
    }

    setName("");
    setIsAddOpen(false);
    await load();
  };

  const onUpdate = async (team: Team, changes: Partial<Team>) => {
    try {
      await updateSuperAdminItem("teams", {
        ...team,
        ...changes,
        _id: team._id,
        team: club,
      });
    } catch {
      enqueueSnackbar(t("pages.teams.saveFailed"), { variant: "error" });
      return;
    }

    await load();
  };

  const onDeleteTeam = async (team: Team) => {
    try {
      await deleteSuperAdminItem("teams", team._id, club);
    } catch {
      enqueueSnackbar(t("pages.teams.saveFailed"), { variant: "error" });
      return;
    }

    await load();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl sx={{ minWidth: 220 }}>
        <InputLabel id="super-admin-teams-club-label">{t("common.club")}</InputLabel>
        <Select
          labelId="super-admin-teams-club-label"
          label={t("common.club")}
          value={club}
          onChange={(event) => setClub(event.target.value)}
        >
          {CLUBS.map((clubOption) => (
            <MenuItem key={clubOption} value={clubOption}>
              {clubOption}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!club && (
        <Typography color="text.secondary">
          {t("pages.teams.pickClubHint")}
        </Typography>
      )}

      {club && !loading && teams.length === 0 && (
        <Typography color="text.secondary">{t("pages.teams.noTeamsYet")}</Typography>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          marginBottom: club ? `${FAB_CONTENT_CLEARANCE}px` : 0,
        }}
      >
        {club &&
          teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              allDogs={dogs}
              editable
              onUpdate={onUpdate}
              onDeleteTeam={onDeleteTeam}
            />
          ))}
      </Box>

      {club && <AddFab onClick={() => setIsAddOpen(true)} />}

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
    </Box>
  );
};

export default SuperAdminTeams;
