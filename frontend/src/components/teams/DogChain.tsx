import React from "react";
import { Box, Typography, TypographyProps } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Dog } from "../../helpers/types";

interface Props {
  dogs: Dog[];
  variant?: TypographyProps["variant"];
  color?: string;
  noWrap?: boolean;
}

// Spaced-out elements, not one joined string.
const DogChain = ({ dogs, variant = "body1", color, noWrap }: Props) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 0.75,
      minWidth: 0,
      overflow: noWrap ? "hidden" : undefined,
    }}
  >
    {dogs.map((dog, index) => (
      <React.Fragment key={dog._id}>
        {index > 0 && (
          // inherit, not "small" - fixed size dwarfs caption text.
          <ArrowForwardIcon fontSize="inherit" color="disabled" sx={{ flexShrink: 0 }} />
        )}

        <Typography variant={variant} color={color} noWrap={noWrap}>
          {dog.name}
        </Typography>
      </React.Fragment>
    ))}
  </Box>
);

export default DogChain;
