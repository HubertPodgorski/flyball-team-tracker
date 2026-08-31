import React from "react";
import { Box, styled, useTheme } from "@mui/material";

const ColumnsStyled = styled(Box, {
  shouldForwardProp: (prop) => prop !== "userPanel",
})(({ theme, userPanel }) => ({
  display: "grid",
  gridGap: userPanel ? "8px" : 0,
  gridTemplateColumns: "1fr 1fr",
  borderRadius: "6px",
  padding: userPanel ? theme.spacing(1) : 0,

  [theme.breakpoints.down("md")]: {
    gridGap: userPanel ? "8px" : 0,
    padding: userPanel ? theme.spacing(1) : 0,
  },
}));

const TasksRow = ({ children, userPanel }) => {
  const theme = useTheme();

  return (
    <ColumnsStyled
      userPanel={userPanel}
      sx={{
        border: userPanel ? `1px solid ${theme.palette.secondary.main}` : "none",
      }}
    >
      {children}
    </ColumnsStyled>
  );
};

export default TasksRow;
