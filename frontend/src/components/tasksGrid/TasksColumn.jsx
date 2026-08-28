import React from "react";
import { Box, styled } from "@mui/material";
import { Droppable } from "@hello-pangea/dnd";

const ColumnStyled = styled(Box, {
  shouldForwardProp: (prop) => prop !== "columnIndex" && prop !== "adminPanel",
})(({ theme, columnIndex, adminPanel }) => ({
  gridColumn: `${Number(columnIndex) + 1} / ${Number(columnIndex) + 2}`,
  display: "grid",
  gridGap: theme.spacing(1),
  gridTemplateColumns: "1fr",
  gridAutoFlow: "row",
  gridAutoRows: "min-content",
  alignItems: "flex-start",
  border: adminPanel ? "1px solid #ddd" : "none",
  borderRadius: "6px",
}));

const TasksColumn = ({ children, columnIndex, adminPanel, rowIndex }) => {
  if (!adminPanel)
    return (
      <ColumnStyled
        key={columnIndex}
        columnIndex={columnIndex}
        adminPanel={adminPanel}
      >
        {children}
      </ColumnStyled>
    );

  return (
    <Droppable droppableId={`${rowIndex}_${columnIndex}`}>
      {({ innerRef, droppableProps, placeholder }) => (
        <ColumnStyled
          ref={innerRef}
          {...droppableProps}
          key={columnIndex}
          columnIndex={columnIndex}
          adminPanel={adminPanel}
        >
          {children}
          {placeholder}
        </ColumnStyled>
      )}
    </Droppable>
  );
};

export default TasksColumn;
