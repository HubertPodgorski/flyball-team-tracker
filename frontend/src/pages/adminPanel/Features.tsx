import React from "react";
import { Box, FormControlLabel, Switch, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useClubSettingsQuery, useUpdateClubSettingsMutation } from "../../queries/clubSettings";
import { useTasksQuery } from "../../queries/tasks";
import { useTeamsQuery } from "../../queries/teams";
import { findLinkedLineup } from "../../helpers/lineupLink";
import { useConfirmModalSoft } from "../../hooks/useConfirmModal";
import { ClubFeatures } from "../../helpers/types";

const FEATURE_KEYS: (keyof ClubFeatures)[] = [
  "teamsAndLineups",
  "crossPasses",
  "eventsCalendar",
  "dogTasksCatalog",
];

const Features = () => {
  const { t } = useTranslation();
  const { data: settings } = useClubSettingsQuery();
  const { data: tasks = [] } = useTasksQuery();
  const { data: teams = [] } = useTeamsQuery();
  const updateMutation = useUpdateClubSettingsMutation();
  const { enqueueSnackbar } = useSnackbar();
  const confirmSoft = useConfirmModalSoft();

  const features = settings?.features;

  const applyToggle = (key: keyof ClubFeatures, value: boolean) => {
    updateMutation.mutate(
      { [key]: value },
      {
        onSuccess: (updated) => {
          // The one cascade in this feature set - worth calling out since the
          // click that caused it didn't touch this switch directly.
          if (key === "teamsAndLineups" && !value && !updated.features.crossPasses) {
            enqueueSnackbar(t("features.crossPassesDisabledToo"), { variant: "info" });
          }
        },
      }
    );
  };

  const onToggle = async (key: keyof ClubFeatures, value: boolean) => {
    if (key !== "teamsAndLineups" || value) {
      applyToggle(key, value);
      return;
    }

    // Nothing would actually change for anyone - skip the warning.
    const linkedTaskCount = tasks.filter((task) => !!findLinkedLineup(task, teams)).length;

    if (linkedTaskCount === 0) {
      applyToggle(key, value);
      return;
    }

    try {
      await confirmSoft(t("features.teamsAndLineups.disableConfirm", { count: linkedTaskCount }));
    } catch {
      return;
    }

    applyToggle(key, value);
  };

  if (!features) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}>
      <Typography variant="h5">{t("nav.features")}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t("features.intro")}
      </Typography>

      {FEATURE_KEYS.map((key) => {
        // The only dependency in this set: no lineups, nothing for a
        // cross-pass to attach to.
        const disabled = key === "crossPasses" && !features.teamsAndLineups;

        return (
          <Box key={key}>
            <FormControlLabel
              control={
                <Switch
                  checked={features[key]}
                  disabled={disabled}
                  onChange={(event) => onToggle(key, event.target.checked)}
                />
              }
              label={t(`features.${key}.title`)}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ marginLeft: "48px", marginTop: -0.5 }}
            >
              {disabled ? t("features.crossPasses.requiresTeams") : t(`features.${key}.body`)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default Features;
