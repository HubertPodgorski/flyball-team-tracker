import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useIsSuperAdmin } from "../../hooks/useIsSuperAdmin";
import { useCurrentTeam } from "../../hooks/useCurrentTeam";
import { useSwitchTeam } from "../../hooks/useSwitchTeam";
import { TEAMS } from "../../helpers/teams";

const TeamSwitch = () => {
  const { user } = useAuthContext();
  const isSuperAdmin = useIsSuperAdmin();
  const navigate = useNavigate();
  const currentTeam = useCurrentTeam();
  const { switchTeam } = useSwitchTeam();

  useEffect(() => {
    if (!user || !isSuperAdmin) {
      navigate({ to: "/login" });
    }
  }, [user, isSuperAdmin, navigate]);

  if (!user || !isSuperAdmin) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h4">Team switch</Typography>

      <Typography variant="body1">
        Currently acting as <b>{currentTeam}</b>
      </Typography>

      <List>
        {TEAMS.map((team) => (
          <ListItemButton
            divider
            key={team}
            disabled={team === currentTeam}
            onClick={() => switchTeam(team)}
          >
            <SwapHorizIcon sx={{ marginRight: 1 }} />
            <ListItemText primary={team} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default TeamSwitch;
