import React from "react";
import { Box, styled } from "@mui/material";

const WrapperStyled = styled(Box)(() => ({
  display: "flex",
  gridGap: 16,
  flexWrap: "wrap",
}));

const ButtonsGrid = ({ children, sx = {} }) => (
  <WrapperStyled sx={{ ...sx }}>{children}</WrapperStyled>
);

export default ButtonsGrid;
