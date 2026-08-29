import React from "react";
import { Box, styled } from "@mui/material";
import { Droppable } from "@hello-pangea/dnd";

// @hello-pangea/dnd (react-beautiful-dnd) doesn't support CSS Grid on
// droppable containers - it can't size the drag placeholder correctly,
// which made it reserve too much space. flex-column is layout-equivalent
// here (this was always a single column) and is what the library expects.
const WrapperStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  // margin, not gap - @hello-pangea/dnd sizes its drag placeholder off each
  // item's margin box, not the container's gap, so gap-based spacing was
  // causing a jump equal to one gap when a drag starts.
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
