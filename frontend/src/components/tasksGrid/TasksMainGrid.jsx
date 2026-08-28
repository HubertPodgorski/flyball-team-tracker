import React from "react";
import { Box, styled } from "@mui/material";
import { Droppable } from "@hello-pangea/dnd";

const WrapperStyled = styled(Box)(({ theme }) => ({
  display: "grid",
  gridAutoFlow: "row",
  gridGap: 16,
  alignItems: "flex-start",

  [theme.breakpoints.down("md")]: {
    gridGap: theme.spacing(1),
  },
}));

// Show first tasks in single column
const TasksMainGrid = ({ children, adminPanel }) => {
  if (adminPanel)
    return (
      <Droppable droppableId={`main-grid`} direction="vertical" type="row">
        {({ innerRef, droppableProps, placeholder }) => (
          <WrapperStyled ref={innerRef} {...droppableProps}>
            {children}
            {placeholder}
          </WrapperStyled>
        )}
      </Droppable>
    );

  return <WrapperStyled>{children}</WrapperStyled>;
};

export default TasksMainGrid;
