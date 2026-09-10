import React from "react";
import { Box, Card, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { NetVsGrossStats } from "../helpers/types";
import { seconds } from "./CompetitionStatsColumnCards";

interface Props {
  // One entry per team of the club (or just the picked team).
  stats: NetVsGrossStats[];
}

const CompetitionNetVsGrossCard = ({ stats }: Props) => {
  const { t } = useTranslation();
  const multiTeam = stats.length > 1;

  return (
    <Card variant="outlined" sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="subtitle1">{t("pages.ejsStats.advanced.netVsGrossTitle")}</Typography>
      <Typography variant="caption" color="text.secondary">
        {t("pages.ejsStats.advanced.netVsGrossHint")}
      </Typography>

      {stats.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("pages.ejsStats.advanced.noRecords")}
        </Typography>
      ) : (
        <Stack sx={{ gap: 1.5 }}>
          {stats.map((team) => {
            const rows: [string, number | null][] = [
              [t("pages.ejsStats.advanced.avgGross"), team.avgGross],
              [t("pages.ejsStats.advanced.avgNet"), team.avgNet],
              [t("pages.ejsStats.advanced.startOverhead"), team.avgStartOverhead],
              [t("pages.ejsStats.advanced.overlap"), team.avgOverlap],
            ];

            return (
              <Stack key={team.teamName} sx={{ gap: 0.5 }}>
                {multiTeam && (
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {team.teamName}
                  </Typography>
                )}

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 0.5, columnGap: 3 }}>
                  {rows.map(([label, value]) => (
                    <React.Fragment key={label}>
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography variant="caption" sx={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {seconds(value)} s
                      </Typography>
                    </React.Fragment>
                  ))}
                  <Typography variant="caption" color="text.secondary">
                    {t("pages.ejsStats.wizard.heats", { count: team.heats })}
                  </Typography>
                  <span />
                </Box>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Card>
  );
};

export default CompetitionNetVsGrossCard;
