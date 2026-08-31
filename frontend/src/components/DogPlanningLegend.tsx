import React from "react";
import { Box, Chip, Typography } from "@mui/material";

const legendItems = [
  { color: "success", label: "Present & planned" },
  { color: "warning", label: "Present, not planned yet" },
  { color: "error", label: "Planned, not present" },
] as const;

// Same 3 colors as DogAttendanceChips (showIfPlanned) and TaskForm's dog select.
const DogPlanningLegend = () => (
  <Box>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
      Legend
    </Typography>

    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {legendItems.map(({ color, label }) => (
        <Chip key={color} label={label} color={color} size="small" />
      ))}
    </Box>
  </Box>
);

export default DogPlanningLegend;
