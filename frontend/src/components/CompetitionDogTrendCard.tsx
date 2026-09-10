import React from "react";
import { Box, Card, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CompetitionDogStats } from "../helpers/types";
import { STAT_COLUMNS, NON_TIME_STAT_COLUMNS } from "./CompetitionStatsColumnCards";
import { OK_GREEN } from "../helpers/statsColors";

interface CompetitionDogTrendCardProps {
  rows: CompetitionDogStats[];
  noDataLabel: string;
  hideAverageTimes?: boolean;
}

// One dog's own stats (aggregated across every uploaded EJS file) in a single card - a two-column grid so labels and values line up.
const CompetitionDogTrendCard = ({ rows, noDataLabel, hideAverageTimes }: CompetitionDogTrendCardProps) => {
  const { t } = useTranslation();
  const columns = hideAverageTimes ? NON_TIME_STAT_COLUMNS : STAT_COLUMNS;

  return (
    <Card variant="outlined" sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="subtitle1">{t("pages.ejsStats.dogTrendTitle")}</Typography>

      {rows.length > 0 ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 0.5, columnGap: 3 }}>
          {rows.map((row, index) => (
            <React.Fragment key={row.name}>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", gridColumn: "1 / -1", borderTop: index > 0 ? 1 : 0, borderColor: "divider", paddingTop: index > 0 ? 1 : 0 }}
              >
                {row.name}
                {row.nameSubLabel && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: "normal", ml: 1 }}>
                    {row.nameSubLabel}
                  </Typography>
                )}
              </Typography>

              {columns.map((column) => (
                <React.Fragment key={column.titleKey}>
                  <Typography variant="caption" color="text.secondary">
                    {t(column.titleKey)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ textAlign: "right", color: column.color === "success" ? OK_GREEN : undefined }}
                    color={column.color === "success" ? undefined : (column.color ?? "text.primary")}
                  >
                    {column.format(column.value(row))}
                  </Typography>
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {noDataLabel}
        </Typography>
      )}
    </Card>
  );
};

export default CompetitionDogTrendCard;
