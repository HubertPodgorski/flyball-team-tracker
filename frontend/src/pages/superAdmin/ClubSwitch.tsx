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
import { useCurrentClub } from "../../hooks/useCurrentClub";
import { useSwitchClub } from "../../hooks/useSwitchClub";
import { TEAMS } from "../../helpers/teams";

const ClubSwitch = () => {
  const { user } = useAuthContext();
  const isSuperAdmin = useIsSuperAdmin();
  const navigate = useNavigate();
  const currentClub = useCurrentClub();
  const { switchClub } = useSwitchClub();

  useEffect(() => {
    if (!user || !isSuperAdmin) {
      navigate({ to: "/login" });
    }
  }, [user, isSuperAdmin, navigate]);

  if (!user || !isSuperAdmin) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h4">Club switch</Typography>

      <Typography variant="body1">
        Currently acting as <b>{currentClub}</b>
      </Typography>

      <List>
        {TEAMS.map((club) => (
          <ListItemButton
            divider
            key={club}
            disabled={club === currentClub}
            onClick={() => switchClub(club)}
          >
            <SwapHorizIcon sx={{ marginRight: 1 }} />
            <ListItemText primary={club} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default ClubSwitch;
