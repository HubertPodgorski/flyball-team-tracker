import React from "react";
import { Box, FormControl, MenuItem, Select, Skeleton, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Modal from "./modals/Modal";
import { useAllTeamMappingsQuery, useSetAdminTeamMappingMutation } from "../queries/competitions";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Super-admin only: assign every EJS team name in the pool to its club, so "Club stats" can sum a club's teams into one row.
const EjsTeamMappingDialog = ({ open, onClose }: Props) => {
  const { t } = useTranslation();
  const { data, isLoading } = useAllTeamMappingsQuery(open);
  const setMapping = useSetAdminTeamMappingMutation();

  return (
    <Modal open={open} onClose={onClose} title={t("pages.ejsStats.mapTeamsTitle")}>
      <Stack sx={{ gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t("pages.ejsStats.mapTeamsHint")}
        </Typography>

        {isLoading || !data ? (
          <Skeleton variant="rounded" height={320} />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr minmax(180px, 240px)",
              columnGap: 2,
              rowGap: 1,
              alignItems: "center",
              maxHeight: 440,
              overflowY: "auto",
            }}
          >
            {data.teamNames.map((teamName) => (
              <React.Fragment key={teamName}>
                <Typography variant="body2">{teamName}</Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    displayEmpty
                    value={data.mappings[teamName] ?? ""}
                    onChange={(event) => setMapping.mutate({ ejsTeamName: teamName, club: event.target.value })}
                  >
                    <MenuItem value="">
                      <em>{t("pages.ejsStats.unassigned")}</em>
                    </MenuItem>
                    {data.clubs.map((club) => (
                      <MenuItem key={club.team} value={club.team}>
                        {club.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </React.Fragment>
            ))}
          </Box>
        )}
      </Stack>
    </Modal>
  );
};

export default EjsTeamMappingDialog;
