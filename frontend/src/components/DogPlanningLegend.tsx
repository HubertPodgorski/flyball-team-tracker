import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

// Same 3 colors as DogAttendanceChips (showIfPlanned) and TaskForm's dog select.
const DogPlanningLegend = () => {
  const { t } = useTranslation();

  const legendItems = [
    { color: "success", label: t("legends.presentPlanned") },
    { color: "warning", label: t("legends.presentNotPlanned") },
    { color: "error", label: t("legends.plannedNotPresent") },
  ] as const;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {t("legends.legend")}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {legendItems.map(({ color, label }) => (
          <Chip key={color} label={label} color={color} size="small" />
        ))}
      </Box>
    </Box>
  );
};

export default DogPlanningLegend;
