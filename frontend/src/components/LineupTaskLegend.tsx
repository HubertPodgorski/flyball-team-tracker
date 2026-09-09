import React from "react";
import { alpha, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import Legend from "./Legend";

// Same hues as the real card fills, but far more opaque - a legend swatch has no busy backdrop image to lean on.
const LineupTaskLegend = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Legend
      items={[
        { label: t("legends.regularTask"), color: theme.palette.background.paper },
        { label: t("legends.lineupTask"), color: alpha(theme.palette.info.main, 0.6) },
      ]}
    />
  );
};

export default LineupTaskLegend;
