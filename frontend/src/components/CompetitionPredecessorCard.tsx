import React from "react";
import { Box, Card, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PredecessorStat } from "../helpers/types";
import { percent, seconds } from "./CompetitionStatsColumnCards";

// A pairing needs at least this many heats to be worth showing - below that it's noise.
const MIN_HEATS = 3;

interface Props {
  pairings: PredecessorStat[];
  // When set, only that dog's own predecessors are listed (the "Dog" tab / "My dogs" cards).
  dogFilter?: string;
}

const byAvgCross = (a: PredecessorStat, b: PredecessorStat) =>
  (a.avgCrossTime ?? Number.POSITIVE_INFINITY) - (b.avgCrossTime ?? Number.POSITIVE_INFINITY);

const PredecessorRows = ({ rows }: { rows: PredecessorStat[] }) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", columnGap: 2, rowGap: 0.5, alignItems: "baseline" }}>
      <Typography variant="caption" color="text.secondary">
        {t("pages.ejsStats.advanced.predecessorCol")}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
        {t("pages.ejsStats.advanced.heatsCol")}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
        {t("pages.ejsStats.advanced.avgCrossCol")}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
        {t("pages.ejsStats.advanced.avgRunCol")}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
        {t("pages.ejsStats.advanced.faultRateCol")}
      </Typography>

      {rows.map((row) => (
        <React.Fragment key={row.predecessor}>
          <Typography variant="body2">{row.predecessor}</Typography>
          <Typography variant="body2" sx={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {row.heats}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {seconds(row.avgCrossTime)}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {seconds(row.avgRunTime)}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }} color="error">
            {percent(row.faultRate)}
          </Typography>
        </React.Fragment>
      ))}
    </Box>
  );
};

const CompetitionPredecessorCard = ({ pairings, dogFilter }: Props) => {
  const { t } = useTranslation();
  const shown = pairings.filter((row) => row.heats >= MIN_HEATS && (!dogFilter || row.dog === dogFilter));
  const dogs = [...new Set(shown.map((row) => row.dog))].sort((a, b) => a.localeCompare(b));

  return (
    <Card variant="outlined" sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Stack sx={{ gap: 0.25 }}>
        <Typography variant="subtitle1">{t("pages.ejsStats.advanced.predecessorTitle")}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t("pages.ejsStats.advanced.predecessorHint", { min: MIN_HEATS })}
        </Typography>
      </Stack>

      {shown.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("pages.ejsStats.advanced.noPredecessorData")}
        </Typography>
      ) : (
        <Stack sx={{ gap: 2 }}>
          {dogs.map((dog) => (
            <Stack key={dog} sx={{ gap: 0.5 }}>
              {!dogFilter && <Typography variant="body2" sx={{ fontWeight: "bold" }}>{dog}</Typography>}
              <PredecessorRows rows={shown.filter((row) => row.dog === dog).sort(byAvgCross)} />
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default CompetitionPredecessorCard;
