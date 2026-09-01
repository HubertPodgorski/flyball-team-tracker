import React from "react";
import { alpha, useTheme } from "@mui/material";
import Legend from "./Legend";

// Colors match the actual card backgrounds (TasksDragNDrop / DogsTaskCell).
const LineupTaskLegend = () => {
  const theme = useTheme();

  return (
    <Legend
      items={[
        {
          label: "Regular task",
          color: alpha(theme.palette.background.paper, 0.75),
          borderColor: theme.palette.secondary.main,
        },
        {
          label: "Lineup task",
          color: alpha(theme.palette.info.main, 0.16),
          borderColor: theme.palette.info.main,
        },
      ]}
    />
  );
};

export default LineupTaskLegend;
