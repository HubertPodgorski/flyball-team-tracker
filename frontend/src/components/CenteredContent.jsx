import React from "react";
import { alpha, Paper, styled } from "@mui/material";

const WrapperStyled = styled(Paper)(({ theme }) => ({
  top: 2,
  minWidth: 400,
  padding: 2,
  height: "fit-content",
  backgroundColor: alpha(theme.palette.background.paper, 0.75),
  backdropFilter: "blur(6px)",

  [theme.breakpoints.down("md")]: {
    padding: 1,
    top: 1,
    minWidth: 300,
  },
}));

const CenteredContent = ({ children, sx = {} }) => (
  <WrapperStyled sx={sx}>{children}</WrapperStyled>
);
export default CenteredContent;
