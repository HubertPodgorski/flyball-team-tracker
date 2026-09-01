import React from "react";
import { alpha, Box, Card, styled } from "@mui/material";

const CardStyled = styled(Card, {
  shouldForwardProp: (prop) => prop !== "lineupLinked",
})(({ theme, lineupLinked }) => ({
  backgroundColor: lineupLinked
    ? alpha(theme.palette.info.main, 0.16)
    : alpha(theme.palette.background.paper, 0.75),
  backdropFilter: "blur(6px)",
}));

const CardContentStyled = styled(Box, {
  shouldForwardProp: (prop) => prop !== "clickable",
})(({ theme, clickable }) => ({
  display: "grid",
  gridAutoFlow: "row",
  padding: theme.spacing(1),
  gridGap: theme.spacing(2),
  alignItems: "center",
  position: "relative",
  cursor: clickable ? "pointer" : "default",
  [theme.breakpoints.down("md")]: {
    gridGap: theme.spacing(0.5),
    padding: theme.spacing(0.5),
  },
}));

const TaskCell = ({ children, lineupLinked, onClick }) => (
  <CardStyled lineupLinked={lineupLinked}>
    <CardContentStyled clickable={!!onClick} onClick={onClick}>
      {children}
    </CardContentStyled>
  </CardStyled>
);

export default TaskCell;
