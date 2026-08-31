import React from "react";
import { alpha, Box, Card, styled } from "@mui/material";

const CardStyled = styled(Card)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.75),
  backdropFilter: "blur(6px)",
}));

const CardContentStyled = styled(Box)(({ theme }) => ({
  display: "grid",
  gridAutoFlow: "row",
  padding: theme.spacing(1),
  gridGap: theme.spacing(2),
  alignItems: "center",
  position: "relative",
  [theme.breakpoints.down("md")]: {
    gridGap: theme.spacing(0.5),
    padding: theme.spacing(0.5),
  },
}));

const TaskCell = ({ children }) => (
  <CardStyled>
    <CardContentStyled>{children}</CardContentStyled>
  </CardStyled>
);

export default TaskCell;
