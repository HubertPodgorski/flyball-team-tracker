import React from "react";
import { Box, Typography } from "@mui/material";

export interface LegendItem {
  label: string;
  color: string;
}

interface Props {
  items: LegendItem[];
}

// Dots, not squares - a bordered square reads as an (unrelated) checkbox, not a color key.
const Legend = ({ items }: Props) => (
  <Box data-testid="legend" sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
    {items.map(({ label, color }) => (
      <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: color,
            flexShrink: 0,
          }}
        />

        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
    ))}
  </Box>
);

export default Legend;
