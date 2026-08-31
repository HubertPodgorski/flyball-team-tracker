import React from "react";
import { Box, styled } from "@mui/material";

const WrapperStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  "& > *:not(:last-child)": {
    marginBottom: 16,
  },

  [theme.breakpoints.down("md")]: {
    "& > *:not(:last-child)": {
      marginBottom: theme.spacing(1),
    },
  },
}));

// Show first tasks in single column
const TasksMainGrid = ({ children }) => <WrapperStyled>{children}</WrapperStyled>;

export default TasksMainGrid;
