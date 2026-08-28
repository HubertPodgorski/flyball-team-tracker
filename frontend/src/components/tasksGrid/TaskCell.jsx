import React from "react";
import { Box, Card, styled } from "@mui/material";
import { Draggable } from "@hello-pangea/dnd";

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
      <Card>
        <CardContentStyled>{children}</CardContentStyled>
      </Card>
    );

  return (
    <Draggable draggableId={id} index={index}>
      {({ draggableProps, dragHandleProps, innerRef }) => (
        <Card
          {...draggableProps}
          {...dragHandleProps}
          ref={innerRef}
          onClick={() => {
            onClick?.();
          }}
        >
          <CardContentStyled>{children}</CardContentStyled>
        </Card>
      )}
    </Draggable>
  );
};

export default TaskCell;
