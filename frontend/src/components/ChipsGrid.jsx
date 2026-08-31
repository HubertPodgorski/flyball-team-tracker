import React from "react";
import PetsIcon from "@mui/icons-material/Pets";
import { Box, styled, useTheme } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";

const WrapperStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyItems: "center",
  gridGap: theme.spacing(2),

  [theme.breakpoints.down("md")]: {
    gridGap: theme.spacing(0.5),
  },
}));

const ChipsGrid = ({ children, sx = {}, dense, people, hideIcon }) => {
  const theme = useTheme();

  return (
    <WrapperStyled
      sx={{
        ...sx,
        ...(dense
          ? {
              padding: 0,
              [theme.breakpoints.down("md")]: {
                padding: 0,
              },
            }
          : {}),
      }}
    >
      {!hideIcon && (people ? <PeopleIcon /> : <PetsIcon />)}
      {children}
    </WrapperStyled>
  );
};

export default ChipsGrid;
