import React from "react";
import { Box, styled } from "@mui/material";
import { Droppable } from "@hello-pangea/dnd";

const ColumnStyled = styled(Box, {
  shouldForwardProp: (prop) => prop !== "columnIndex" && prop !== "adminPanel",
})(({ theme, columnIndex, adminPanel }) => ({
  // @hello-pangea/dnd (react-beautiful-dnd) doesn't support CSS Grid on
  // droppable containers - it can't size the drag placeholder correctly,
  // which made it reserve too much space. flex-column is layout-equivalent
  // here (this was always a single column) and is what the library expects.
  gridColumn: `${Number(columnIndex) + 1} / ${Number(columnIndex) + 2}`,
  display: "flex",
  flexDirection: "column",
  // margin, not gap - @hello-pangea/dnd sizes its drag placeholder off each
  // item's margin box, not the container's gap, so gap-based spacing was
  // causing a jump equal to one gap when a drag starts. The spacer before
  // "Add task here" opts out of this - it sets its own gap explicitly.
  "& > *:not(:last-child):not([data-task-column-spacer])": {
    marginBottom: theme.spacing(1),
  },
  // outline, not border - border participates in layout (box-sizing) and
  // changing/matching it between columns is what caused the dragged card to
  // visibly jump by a pixel or two crossing from one column to another.
  // outline paints outside the box without affecting layout at all.
  outline: adminPanel ? `1px solid ${theme.palette.secondary.main}` : "none",
  outlineOffset: "-1px",
  borderRadius: "6px",
  ...(adminPanel && {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: "4px",
  }),
}));

// Roughly a single-line TaskCell's rendered height - used so an empty
// column reserves enough room above "Add task here" to drop a card into,
// instead of just a thin 16px sliver.
const EMPTY_COLUMN_MIN_HEIGHT = "88px";

const TasksColumn = ({
  children,
  footer,
  columnIndex,
  adminPanel,
  rowIndex,
  collapsePlaceholder,
  isEmpty,
}) => {
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
      {({ innerRef, droppableProps, placeholder }, { isDraggingOver }) => (
        <ColumnStyled
          ref={innerRef}
          {...droppableProps}
          key={columnIndex}
          columnIndex={columnIndex}
          adminPanel={adminPanel}
        >
          {children}
          {/* @hello-pangea/dnd expects the placeholder node to stay mounted
              at all times (it warns/breaks otherwise) - collapse it visually
              instead of removing it from the DOM. */}
          <Box
            sx={
              collapsePlaceholder
                ? { height: 0, margin: "0 !important", overflow: "hidden" }
                : undefined
            }
          >
            {placeholder}
          </Box>
          {/* grows to push the footer to the bottom when there's slack,
              but always keeps at least 16px above it - or a full card
              height when the column is empty, so there's room to drop one.
              While something's actively being dragged over this column the
              placeholder above already reserves that card-sized space, so
              the spacer drops back to 16px instead of stacking on top of it.
              Transitioned - dragging the last task out of a row makes both
              its columns flip to "empty" (16px -> 88px) right at drop time,
              and snapping that instantly reflowed the whole row (and could
              nudge rows below it), which read as a jump. */}
          <Box
            data-task-column-spacer
            sx={{
              flexGrow: 1,
              minHeight:
                isEmpty && !isDraggingOver ? EMPTY_COLUMN_MIN_HEIGHT : "16px",
              transition: "min-height 0.15s ease",
            }}
          />
          {footer}
        </ColumnStyled>
      )}
    </Droppable>
  );
};

export default TasksColumn;
