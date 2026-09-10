import React, { useState } from "react";
import { Box, Button, Card, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { CompetitionDogStats } from "../helpers/types";
import { OK_GREEN } from "../helpers/statsColors";

const INITIAL_ROWS = 5;
const EXPANDED_MAX_HEIGHT = 320;

export const percent = (value: number | null) => (value === null ? "–" : `${(value * 100).toFixed(0)}%`);
export const seconds = (value: number | null) => (value === null ? "–" : value.toFixed(2));
const plain = (value: number | null) => (value === null ? "–" : String(value));

// Non-faulty passes over all passes - not okPercentOfCleanPasses, which excludes faults from its own denominator.
const effectiveness = (row: CompetitionDogStats) => (row.totalPasses ? (row.totalPasses - row.faultCount) / row.totalPasses : null);

export interface StatColumnDef {
  titleKey: string;
  value: (row: CompetitionDogStats) => number | null;
  format: (value: number | null) => string;
  sort: "asc" | "desc";
  // Matches the same color family used everywhere else: red for faults, green for ok, blue for effectiveness. Omitted for neutral columns.
  color?: "error" | "success" | "info";
}

// One card per former table column - "asc" for times (fastest first), "desc" for rates and counts (most notable first).
export const STAT_COLUMNS: StatColumnDef[] = [
  { titleKey: "pages.ejsStats.columns.passes", value: (row) => row.totalPasses, format: plain, sort: "desc" },
  { titleKey: "pages.ejsStats.columns.faultRate", value: (row) => row.faultRate, format: percent, sort: "desc", color: "error" },
  { titleKey: "pages.ejsStats.columns.okOfAll", value: (row) => row.okPercentOfAllPasses, format: percent, sort: "desc", color: "success" },
  { titleKey: "pages.ejsStats.columns.effectiveness", value: effectiveness, format: percent, sort: "desc", color: "info" },
  { titleKey: "pages.ejsStats.columns.avgRunTime", value: (row) => row.avgRunTime, format: seconds, sort: "asc" },
  { titleKey: "pages.ejsStats.columns.avgLightsTime", value: (row) => row.avgLightsTime, format: seconds, sort: "asc" },
];

// Aggregated club/lineup rows have no per-pass timings, so their average-time cards would only ever read "–".
export const NON_TIME_STAT_COLUMNS = STAT_COLUMNS.filter((column) => column.format !== seconds);

interface StatColumnCardProps {
  column: StatColumnDef;
  rows: CompetitionDogStats[];
  noDataLabel: string;
  t: TFunction;
}

// "success" gets the feature's own brighter green instead of the app's (fairly dark) theme one - error/info stay theme-driven.
const colorPropsFor = (color: StatColumnDef["color"]) => (color === "success" ? { sx: { color: OK_GREEN } } : { color: color ?? undefined });

// Rows with no value for this column are dropped rather than shown as blank, then sorted so the card reads like a leaderboard.
const StatColumnCard = ({ column, rows, noDataLabel, t }: StatColumnCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const sorted = rows
    .filter((row) => row.name && column.value(row) !== null)
    .sort((a, b) => (column.sort === "asc" ? (column.value(a) as number) - (column.value(b) as number) : (column.value(b) as number) - (column.value(a) as number)));
  const visible = expanded ? sorted : sorted.slice(0, INITIAL_ROWS);
  const hiddenCount = sorted.length - INITIAL_ROWS;
  const titleColorProps = column.color ? colorPropsFor(column.color) : { color: "text.primary" as const };
  const valueColorProps = column.color ? colorPropsFor(column.color) : { color: "text.secondary" as const };

  return (
    // Outlined - these nest inside the stats Card, which shares the same solid background and would otherwise blend in.
    <Card variant="outlined" sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="subtitle1" {...titleColorProps}>
        {t(column.titleKey)}
      </Typography>

      {sorted.length > 0 ? (
        <Stack
          sx={{
            gap: 0.75,
            overflowY: expanded ? "auto" : "visible",
            maxHeight: expanded ? EXPANDED_MAX_HEIGHT : "none",
            // Room for the scrollbar so it doesn't sit on top of the right-aligned values.
            pr: expanded ? 1 : 0,
          }}
        >
          {visible.map((row) => (
            // Keyed by name, not dogId - in dog mode every row is the same dog on a different day, so dogId repeats.
            <Stack key={row.name} direction="row" sx={{ justifyContent: "space-between", gap: 2, alignItems: "baseline" }}>
              {row.nameSubLabel ? (
                <Box>
                  <Typography variant="body2">{row.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {row.nameSubLabel}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2">{row.name}</Typography>
              )}
              <Typography variant="body2" {...valueColorProps}>
                {column.format(column.value(row))}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {noDataLabel}
        </Typography>
      )}

      {hiddenCount > 0 && (
        <Button size="small" onClick={() => setExpanded((current) => !current)} sx={{ alignSelf: "flex-start" }}>
          {expanded ? t("pages.ejsStats.showLess") : t("pages.ejsStats.showMore", { count: hiddenCount })}
        </Button>
      )}
    </Card>
  );
};

interface CompetitionStatsColumnCardsProps {
  rows: CompetitionDogStats[];
  noDataLabel: string;
  hideAverageTimes?: boolean;
}

// Replaces the old table: one scrollable, expandable card per column, stacked on mobile and 3-wide on desktop.
const CompetitionStatsColumnCards = ({ rows, noDataLabel, hideAverageTimes }: CompetitionStatsColumnCardsProps) => {
  const { t } = useTranslation();
  const columns = hideAverageTimes ? NON_TIME_STAT_COLUMNS : STAT_COLUMNS;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
      {columns.map((column) => (
        <StatColumnCard key={column.titleKey} column={column} rows={rows} noDataLabel={noDataLabel} t={t} />
      ))}
    </Box>
  );
};

export default CompetitionStatsColumnCards;
