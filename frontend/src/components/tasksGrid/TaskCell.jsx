import React from "react";
import { alpha, Box, Card, styled } from "@mui/material";
import { Draggable } from "@hello-pangea/dnd";

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

const TaskCell = ({ children, adminPanel, id, index, onClick }) => {
  if (!adminPanel)
    return (
      <CardStyled>
        <CardContentStyled>{children}</CardContentStyled>
      </CardStyled>
    );

  return (
    <Draggable draggableId={id} index={index}>
      {({ draggableProps, dragHandleProps, innerRef }) => (
        <CardStyled
          {...draggableProps}
          {...dragHandleProps}
          ref={innerRef}
          sx={{ marginLeft: "4px", marginRight: "4px" }}
          onClick={() => {
            onClick?.();
          }}
        >
          <CardContentStyled>{children}</CardContentStyled>
        </CardStyled>
      )}
    </Draggable>
  );
};

export default TaskCell;
