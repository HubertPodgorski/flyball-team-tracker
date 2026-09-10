import React from "react";
import { Card, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { CompetitionRecords } from "../helpers/types";
import { seconds } from "./CompetitionStatsColumnCards";

interface Props {
  records: CompetitionRecords;
  // When set, only that one dog's personal best is shown (the "Dog" tab / "My dogs" cards).
  dogFilter?: string;
}

const where = (t: TFunction, eventName: string | null, division?: number | null) => {
  const parts = [eventName, division != null ? t("pages.ejsStats.advanced.divisionShort", { division }) : null].filter(Boolean);

  return parts.length ? ` · ${parts.join(", ")}` : "";
};

const Record = ({ label, value, note }: { label: string; value: number; note: string }) => (
  <Typography variant="body2">
    <strong>{label}:</strong> {seconds(value)} s
    <Typography component="span" variant="caption" color="text.secondary">
      {note}
    </Typography>
  </Typography>
);

const CompetitionRecordsCard = ({ records, dogFilter }: Props) => {
  const { t } = useTranslation();
  const dogBests = dogFilter ? records.dogBests.filter((row) => row.dog === dogFilter) : records.dogBests;
  const teamBests = dogFilter ? [] : records.teamBests;
  const hasAny = teamBests.length > 0 || dogBests.length > 0;

  return (
    <Card variant="outlined" sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="subtitle1">{t("pages.ejsStats.advanced.recordsTitle")}</Typography>

      {!hasAny ? (
        <Typography variant="body2" color="text.secondary">
          {t("pages.ejsStats.advanced.noRecords")}
        </Typography>
      ) : (
        <Stack sx={{ gap: 0.75 }}>
          {teamBests.map((row) => (
            <Stack key={row.teamName} sx={{ gap: 0.25 }}>
              <Record
                label={t("pages.ejsStats.advanced.bestNetTime", { team: row.teamName })}
                value={row.value}
                note={where(t, row.eventName, row.division)}
              />
              {row.dogs.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                  {row.dogs.join(" → ")}
                </Typography>
              )}
            </Stack>
          ))}

          {(dogFilter ? dogBests.slice(0, 1) : dogBests).map((row) => (
            <Record
              key={row.dog}
              label={dogFilter ? t("pages.ejsStats.advanced.fastestRun") : row.dog}
              value={row.value}
              note={where(t, row.eventName)}
            />
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default CompetitionRecordsCard;
