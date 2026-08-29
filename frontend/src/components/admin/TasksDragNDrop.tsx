import React, { useState } from "react";
import TasksMainGrid from "../tasksGrid/TasksMainGrid";
import TasksRow from "../tasksGrid/TasksRow";
import TasksColumn from "../tasksGrid/TasksColumn";
import { Chip, IconButton, Typography } from "@mui/material";
import TaskCell from "../tasksGrid/TaskCell";
import ChipsGrid from "../ChipsGrid";
import DeleteIcon from "@mui/icons-material/Delete";
import { DragDropContext } from "@hello-pangea/dnd";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useMoveTasksRow } from "../../hooks/useMoveTasksRow";
import { useMoveTasksCell } from "../../hooks/useMoveTasksCell";
import AddTaskHereButton from "../../components/AddTaskHereButton";
import { getNewTaskPosition } from "./helpers";
import { useSocketContext } from "../../hooks/useSocketContext";
import { Task } from "../../helpers/types";

export type MappedTasks = Record<string, Record<string, Task[]>>;

interface Props {
  onTaskEditClick: (
    task: Pick<Task, "position" | "description" | "dogs">,
    _id: string
  ) => Promise<void>;
  mappedTasks: MappedTasks;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const TasksDragNDrop = ({
  onTaskEditClick,
  mappedTasks,
  onDragStart: onDragStartProp,
  onDragEnd: onDragEndProp,
}: Props) => {
  const { socket } = useSocketContext();

  const moveTasksRow = useMoveTasksRow();
  const moveTasksCell = useMoveTasksCell();

  const isMobile = useIsMobile();

  // Once the dragged item has left its source column for a different one,
  // there's no reason to keep the source's placeholder reserving space -
  // collapse it instead of holding the gap open for the whole drag.
  const [collapsedDroppableId, setCollapsedDroppableId] = useState<
    string | null
  >(null);

  const onDelete = (taskId) => {
    socket.emit("delete_task", { _id: taskId });
  };

  const onDragUpdate = (update) => {
    const { source, destination } = update;

    // destination is null while the pointer is between valid drop targets
    // (e.g. exactly on the border between two touching columns) - that's
    // not "back in the source column", it's just a transient gap. Leave
    // collapsedDroppableId as-is rather than un-collapsing the source for
    // that instant, which was causing a visible flash right at the border.
    if (!destination) return;

    if (destination.droppableId !== source.droppableId) {
      setCollapsedDroppableId(source.droppableId);
    } else {
      setCollapsedDroppableId(null);
    }
  };

  const onDragEnd = async (result) => {
    setCollapsedDroppableId(null);

    // Update state synchronously here, same tick - this is
    // @hello-pangea/dnd's own recommended pattern. Deferring it (e.g. via
    // setTimeout) makes the browser paint the library's own resting frame
    // first and our re-sorted data a moment later, which is what caused a
    // visible jump on drop. The "add/remove a Draggable while dragging"
    // warning this used to work around was actually caused elsewhere (a
    // killed CSS transition breaking the library's drop-completion
    // detection) and is now fixed at that source - see index.css.
    if (result.type === "row") {
      moveTasksRow(result);
    } else {
      moveTasksCell(result, mappedTasks);
    }

    onDragEndProp?.();
  };

  const onEditClick = async ({ position, description, dogs, _id }) => {
    await onTaskEditClick(
      {
        position,
        description,
        dogs,
      },
      _id
    );
  };

  return (
    <DragDropContext
      onDragStart={onDragStartProp}
      onDragEnd={onDragEnd}
      onDragUpdate={onDragUpdate}
    >
      <TasksMainGrid adminPanel>
        {Object.entries(mappedTasks).map(([rowIndex, columns], index) => (
          <TasksRow
            key={`${rowIndex}_${index}`}
            rowIndex={rowIndex}
            adminPanel
            index={index}
          >
            {Object.entries(columns).map(([columnIndex, items]) => (
              <TasksColumn
                rowIndex={rowIndex}
                columnIndex={columnIndex}
                key={columnIndex}
                adminPanel
                isEmpty={!items.length}
                collapsePlaceholder={
                  collapsedDroppableId === `${rowIndex}_${columnIndex}`
                }
                footer={
                  <AddTaskHereButton
                    columnIndex={+columnIndex}
                    rowIndex={+rowIndex}
                    positionIndex={getNewTaskPosition(items)}
                  />
                }
              >
                {!!items.length &&
                  items.map((item, index) => (
                    <TaskCell
                      index={index}
                      adminPanel
                      id={item._id}
                      key={item._id}
                      onClick={() => {
                        onEditClick(item);
                      }}
                    >
                      <Typography variant={isMobile ? "body2" : "h5"}>
                        {item.description}
                      </Typography>

                      {item.dogs.length > 0 && (
                        <ChipsGrid>
                          {item.dogs.map(({ name, _id }) => (
                            <Chip label={name} key={_id} />
                          ))}
                        </ChipsGrid>
                      )}

                      {item.dogs.length === 0 && (
                        <Typography>No dogs selected</Typography>
                      )}

                      <IconButton
                        sx={{ position: "absolute", top: 2, right: 2 }}
                        color="error"
                        onClick={(event) => {
                          event.stopPropagation();

                          onDelete(item._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TaskCell>
                  ))}
              </TasksColumn>
            ))}
          </TasksRow>
        ))}
      </TasksMainGrid>
    </DragDropContext>
  );
};

export default TasksDragNDrop;
