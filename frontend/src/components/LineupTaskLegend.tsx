import React from "react";
import { alpha, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import Legend from "./Legend";

// Colors match the actual card backgrounds (TasksDragNDrop / DogsTaskCell).
const LineupTaskLegend = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Legend
      items={[
        {
          label: t("legends.regularTask"),
          color: alpha(theme.palette.background.paper, 0.75),
          borderColor: theme.palette.secondary.main,
        },
        {
          label: t("legends.lineupTask"),
          color: alpha(theme.palette.info.main, 0.16),
          borderColor: theme.palette.info.main,
        },
      ]}
    />
  );
};

export default LineupTaskLegend;
