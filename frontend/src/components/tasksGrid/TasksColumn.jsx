import React from "react";
import { Box, styled } from "@mui/material";

const ColumnStyled = styled(Box, {
  shouldForwardProp: (prop) => prop !== "columnIndex",
})(({ theme, columnIndex }) => ({
  gridColumn: `${Number(columnIndex) + 1} / ${Number(columnIndex) + 2}`,
  display: "flex",
  flexDirection: "column",
  "& > *:not(:last-child)": {
    marginBottom: theme.spacing(1),
  },
}));

const TasksColumn = ({ children, columnIndex }) => (
  <ColumnStyled columnIndex={columnIndex}>{children}</ColumnStyled>
);

export default TasksColumn;
