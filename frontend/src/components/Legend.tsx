import React from "react";
import { Box, Typography } from "@mui/material";

export interface LegendItem {
  label: string;
  color: string;
  borderColor?: string;
}

interface Props {
  items: LegendItem[];
}

// Swatches, not Chips - illustrating a background, not a label.
const Legend = ({ items }: Props) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
    {items.map(({ label, color, borderColor }) => (
      <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: "4px",
            border: borderColor ? `1px solid ${borderColor}` : "none",
            backgroundColor: color,
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
