import React, { useEffect, useState } from "react";
import { ReactSortable, type ItemInterface } from "react-sortablejs";
import { Box, Card, Chip, IconButton, Typography, alpha, styled } from "@mui/material";
import { useTranslation } from "react-i18next";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import AddTaskHereButton from "../../components/AddTaskHereButton";
import { getNewTaskPosition } from "./helpers";
import { useMoveTasksRow } from "../../hooks/useMoveTasksRow";
import { useMoveTasksCell } from "../../hooks/useMoveTasksCell";
import { useDeleteTasksRow } from "../../hooks/useDeleteTasksRow";
import { useDeleteTask } from "../../hooks/useDeleteTask";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useConfirmModalSoft } from "../../hooks/useConfirmModal";
import { useDogsWithAttendance } from "../../hooks/useDogsWithAttendance";
import { useTaskPlanningContext } from "../../hooks/useTaskPlanningContext";
import { getDogPlanningColor } from "../../helpers/calendar";
import { Task } from "../../helpers/types";
import { findLinkedLineup } from "../../helpers/lineupLink";
import { useTeamsQuery } from "../../queries/teams";

export type MappedTasks = Record<string, Record<string, Task[]>>;

// Built on react-sortablejs.

const RowStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  borderRadius: "6px",
  marginBottom: theme.spacing(0.5),
}));

const RowHandleBarStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0.5),
  paddingLeft: theme.spacing(1),
  border: `1px solid ${theme.palette.secondary.main}`,
  borderBottom: "none",
  borderTopLeftRadius: "6px",
  borderTopRightRadius: "6px",
  color: theme.palette.info.main,
  position: "relative",
}));

// The actual drag handle (icon is RowMoveIconStyled, decorative).
const RowDragZoneStyled = styled(Box)(() => ({
  flexGrow: 1,
  // Empty - collapses to 0 height without flexGrow.
  alignSelf: "stretch",
  cursor: "grab",
}));

const RowMoveIconStyled = styled(OpenWithIcon)(() => ({
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  // Decorative - clicks pass through to the drag zone.
  pointerEvents: "none",
}));

const ColumnsGridStyled = styled(Box)(() => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  borderRadius: "6px",
}));

const ColumnStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  outline: `1px solid ${theme.palette.secondary.main}`,
  outlineOffset: "-1px",
  borderRadius: "6px",
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  minHeight: "88px",
}));

const CardStyled = styled(Card, {
  shouldForwardProp: (prop) => prop !== "lineupLinked",
})<{ lineupLinked?: boolean }>(({ theme, lineupLinked }) => ({
  backgroundColor: lineupLinked
    ? alpha(theme.palette.info.main, 0.16)
    : alpha(theme.palette.background.paper, 0.75),
  backdropFilter: "blur(6px)",
  cursor: "grab",
}));

const CardContentStyled = styled(Box)(({ theme }) => ({
  display: "grid",
  gridAutoFlow: "row",
  padding: theme.spacing(1),
  gridGap: theme.spacing(2),
  alignItems: "center",
  position: "relative",
}));

interface RowItem extends ItemInterface {
  rowIndex: string;
}

interface CellItem extends ItemInterface {
  task: Task;
}

const buildRowList = (mappedTasks: MappedTasks): RowItem[] =>
  Object.keys(mappedTasks).map((rowIndex) => ({ id: rowIndex, rowIndex }));

const buildCellLists = (mappedTasks: MappedTasks): Record<string, CellItem[]> => {
  const cellLists: Record<string, CellItem[]> = {};
  Object.entries(mappedTasks).forEach(([rowIndex, columns]) => {
    Object.entries(columns).forEach(([columnIndex, items]) => {
      cellLists[`${rowIndex}_${columnIndex}`] = items.map((task) => ({
        id: task._id,
        task,
      }));
    });
  });
  return cellLists;
};

interface Props {
  onTaskEditClick: (
    task: Pick<Task, "position" | "description" | "dogs" | "matchupRef">,
    _id: string
  ) => Promise<void>;
  mappedTasks: MappedTasks;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const TasksDragNDrop = ({
  onTaskEditClick,
  mappedTasks,
  onDragStart,
  onDragEnd,
}: Props) => {
  const { t } = useTranslation();
  const moveTasksRow = useMoveTasksRow();
  const moveTasksCell = useMoveTasksCell();
  const deleteTasksRow = useDeleteTasksRow();
  const deleteTask = useDeleteTask();
  const confirmSoft = useConfirmModalSoft();
  const isMobile = useIsMobile();
  const { selectedEventId } = useTaskPlanningContext();
  const dogsWithAttendance = useDogsWithAttendance(selectedEventId);
  const { data: teams = [] } = useTeamsQuery();

  const [rowList, setRowList] = useState<RowItem[]>(() => buildRowList(mappedTasks));
  const [cellLists, setCellLists] = useState<Record<string, CellItem[]>>(() =>
    buildCellLists(mappedTasks)
  );

  useEffect(() => {
    setRowList(buildRowList(mappedTasks));
    setCellLists(buildCellLists(mappedTasks));
  }, [mappedTasks]);

  const onDelete = (taskId: string) => {
    deleteTask(taskId);
  };

  const onDeleteRowClick = async (rowIndex: string) => {
    await confirmSoft(t("tasksGrid.removeRowConfirm"));
    deleteTasksRow(+rowIndex);
  };

  // Always edits, lineup-linked or not (cross-pass view is DogsTaskCell only).
  const onCardClick = async (task: Task) => {
    const { position, description, dogs, matchupRef, _id } = task;
    await onTaskEditClick({ position, description, dogs, matchupRef }, _id);
  };

  return (
    <ReactSortable
      list={rowList}
      setList={setRowList}
      handle="[data-row-handle]"
      animation={150}
      // Pointer-based drag, not native HTML5 DnD.
      forceFallback
      // Escapes any blurred/transformed ancestor Card - otherwise the fixed-
      // position drag clone renders offset from the cursor (containing block
      // rules: backdrop-filter/transform/filter on an ancestor become the
      // containing block for position:fixed descendants).
      fallbackOnBody
      // No dropping past the trailing empty row.
      onMove={(evt) => {
        // Must return `true` to allow - `undefined` reads as cancel.
        const relatedIsEmptyRow = evt.related.hasAttribute("data-row-empty");
        const isPastLastItem =
          evt.related === evt.to && evt.to.lastElementChild?.hasAttribute("data-row-empty");

        if ((relatedIsEmptyRow && evt.willInsertAfter) || isPastLastItem) {
          return false;
        }
        return true;
      }}
      onStart={() => onDragStart?.()}
      onEnd={(evt) => {
        onDragEnd?.();
        const { oldIndex, newIndex } = evt;
        if (
          typeof oldIndex !== "number" ||
          typeof newIndex !== "number" ||
          oldIndex === newIndex
        ) {
          return;
        }
        moveTasksRow({ source: { index: oldIndex }, destination: { index: newIndex } });
      }}
    >
      {rowList.map(({ rowIndex }) => {
        const columns = mappedTasks[rowIndex] ?? {};
        const isEmptyRow = Object.values(columns).every((tasks) => tasks.length === 0);

        return (
          <RowStyled key={rowIndex} data-row-empty={isEmptyRow || undefined}>
            {/* Empty row can't be moved or deleted - skip the bar entirely. */}
            {!isEmptyRow && (
              <RowHandleBarStyled>
                <RowDragZoneStyled data-row-handle />
                <RowMoveIconStyled fontSize="small" />

                <IconButton
                  size="small"
                  color="error"
                  // Stops this press from ever being read as a drag start.
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={() => {
                    onDeleteRowClick(rowIndex);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </RowHandleBarStyled>
            )}

            <ColumnsGridStyled>
              {Object.entries(columns).map(([columnIndex]) => {
                const cellKey = `${rowIndex}_${columnIndex}`;
                const cellList = cellLists[cellKey] ?? [];

                return (
                  <ColumnStyled
                    key={columnIndex}
                    // Empty row has no handle bar, so columns own the rounding.
                    sx={
                      isEmptyRow
                        ? {
                            borderTopLeftRadius: columnIndex === "0" ? "6px" : 0,
                            borderTopRightRadius: columnIndex === "1" ? "6px" : 0,
                          }
                        : undefined
                    }
                  >
                    <ReactSortable
                      list={cellList}
                      setList={(newList) =>
                        setCellLists((prev) => ({ ...prev, [cellKey]: newList }))
                      }
                      group="tasks-cells"
                      animation={150}
                      forceFallback
                      fallbackOnBody
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flexGrow: 1,
                        gap: "4px",
                        padding: "4px",
                      }}
                      // `id`, not data-*: ReactSortable only forwards id.
                      id={cellKey}
                      onStart={() => onDragStart?.()}
                      onEnd={(evt) => {
                        onDragEnd?.();
                        const { oldIndex, newIndex, from, to, item } = evt;
                        const sourceDroppableId = from.id;
                        const destinationDroppableId = to.id;
                        const draggableId = item.dataset.taskId;

                        if (
                          typeof oldIndex !== "number" ||
                          typeof newIndex !== "number" ||
                          !sourceDroppableId ||
                          !destinationDroppableId ||
                          !draggableId ||
                          (sourceDroppableId === destinationDroppableId &&
                            oldIndex === newIndex)
                        ) {
                          return;
                        }

                        moveTasksCell(
                          {
                            draggableId,
                            source: { droppableId: sourceDroppableId, index: oldIndex },
                            destination: {
                              droppableId: destinationDroppableId,
                              index: newIndex,
                            },
                          },
                          mappedTasks
                        );
                      }}
                    >
                      {cellList.map(({ task }) => {
                        const isLineupLinked = !!findLinkedLineup(task, teams);

                        return (
                          <CardStyled
                            key={task._id}
                            data-task-id={task._id}
                            lineupLinked={isLineupLinked}
                          >
                            <CardContentStyled
                              onClick={() => {
                                onCardClick(task);
                              }}
                            >
                              {task.description && (
                                <Typography variant={isMobile ? "body2" : "h5"}>
                                  {task.description}
                                </Typography>
                              )}

                              {task.dogs.length > 0 && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                  }}
                                >
                                  {task.dogs.map(({ name, _id }) => {
                                    const attendance = dogsWithAttendance.find(
                                      ({ _id: dogId }) => dogId === _id
                                    );
                                    // "Shouldn't be planned" flag only.
                                    const isMisplanned =
                                      !!attendance &&
                                      getDogPlanningColor(
                                        attendance.isPlanned,
                                        attendance.status
                                      ) === "error";

                                    return (
                                      <Chip
                                        label={name}
                                        key={_id}
                                        color={isMisplanned ? "error" : "default"}
                                        sx={{ alignSelf: "flex-start" }}
                                      />
                                    );
                                  })}
                                </Box>
                              )}

                              {task.dogs.length === 0 && (
                                <Typography>{t("tasksGrid.noDogsSelected")}</Typography>
                              )}

                              <IconButton
                                sx={{ position: "absolute", top: 2, right: 2 }}
                                color="error"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onDelete(task._id);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </CardContentStyled>
                          </CardStyled>
                        );
                      })}
                    </ReactSortable>

                    <AddTaskHereButton
                      columnIndex={+columnIndex}
                      rowIndex={+rowIndex}
                      positionIndex={getNewTaskPosition(
                        cellList.map(({ task }) => task)
                      )}
                    />
                  </ColumnStyled>
                );
              })}
            </ColumnsGridStyled>
          </RowStyled>
        );
      })}
    </ReactSortable>
  );
};

export default TasksDragNDrop;
