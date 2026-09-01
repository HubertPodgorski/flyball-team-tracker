import React from "react";
import { Box, Typography } from "@mui/material";
import { useAppContext } from "../../hooks/useAppContext";
import { useTeamsQuery } from "../../queries/teams";
import TeamCard from "../../components/teams/TeamCard";

const Teams = () => {
  const { dogs } = useAppContext();
  const { data: teams = [] } = useTeamsQuery();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {teams.length === 0 && (
        <Typography color="text.secondary">No teams yet</Typography>
      )}

      {teams.map((team) => (
        <TeamCard key={team._id} team={team} allDogs={dogs} editable={false} />
      ))}
    </Box>
  );
};

export default Teams;
