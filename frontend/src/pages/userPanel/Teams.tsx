import React from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useDogsQuery } from "../../queries/dogs";
import { useTeamsQuery } from "../../queries/teams";
import TeamCard from "../../components/teams/TeamCard";

const Teams = () => {
  const { t } = useTranslation();
  const { data: dogs = [] } = useDogsQuery();
  const { data: teams = [] } = useTeamsQuery();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {teams.length === 0 && (
        <Typography color="text.secondary">{t("pages.teams.noTeamsYet")}</Typography>
      )}

      {teams.map((team) => (
        <TeamCard key={team._id} team={team} allDogs={dogs} editable={false} />
      ))}
    </Box>
  );
};

export default Teams;
