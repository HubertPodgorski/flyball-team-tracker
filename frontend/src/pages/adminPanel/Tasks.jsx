import React, { useState } from "react";
import { flushSync } from "react-dom";
import { useGetMappedTasks } from "../../hooks/useGetMappedTasks";
import { Box, Button, Stack, useTheme } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import TaskForm from "../forms/TaskForm";
import { useGetMaxRowIndex } from "../../hooks/useGetMaxRowIndex";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import TasksDragNDrop from "../../components/admin/TasksDragNDrop";
import CurrentEventSelectWithDogs from "../../components/admin/CurrentEventSelectWithDogs";
import TasksPrintView from "../../components/tasksGrid/TasksPrintView";
import { TaskPlanningProvider } from "../../contexts/TaskPlanningContext";
import { useTaskPlanningContext } from "../../hooks/useTaskPlanningContext";
import { useCopyTasksFromPreviousMutation } from "../../queries/tasks";
import { useClubFeatures } from "../../hooks/useClubFeatures";

// Inside TaskPlanningProvider so it can scope the board to the picked session's tasks; "" (no pick) falls back to the default board.
const TasksBoard = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  // TODO: load tasks from template

  const { enqueueSnackbar } = useSnackbar();
  const { eventsCalendar: eventsCalendarEnabled } = useClubFeatures();
  const { selectedEventId } = useTaskPlanningContext();
  const [isDragging, setIsDragging] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const { mappedTasks } = useGetMappedTasks(true, isDragging, selectedEventId || "none");
  const maxRowIndex = useGetMaxRowIndex(mappedTasks);
  const copyFromPreviousMutation = useCopyTasksFromPreviousMutation();

  const boardHasTasks = Object.values(mappedTasks).some((columns) =>
    Object.values(columns).some((items) => items.length > 0)
  );
  // Only offered on an empty session board - seeding a non-empty one would just duplicate what's there.
  const canCopyFromPrevious = !!selectedEventId && !boardHasTasks;

  const onCopyFromPrevious = () => {
    copyFromPreviousMutation.mutate(selectedEventId, {
      onSuccess: ({ copied }) => {
        if (copied === 0) enqueueSnackbar(t("tasksGrid.noPreviousPlan"), { variant: "info" });
      },
      onError: () => enqueueSnackbar(t("tasksGrid.copyFailed"), { variant: "error" }),
    });
  };

  // Mounted only on click, not from page load, so it never duplicates every task's text in the DOM at rest.
  const onDownloadPdf = () => {
    flushSync(() => setShowPrintView(true));
    window.print();
  };

  const {
    editingId: taskEditingId,
    formOpen: taskFormOpen,
    onEditClick: onTaskEditClick,
    onFormClose: onTaskFormClose,
    formInitialData: taskFormInitialData,
  } = useFormHelpers({
    description: "",
    dogs: [],
    position: { columnIndex: 0, positionIndex: 0, rowIndex: maxRowIndex },
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gridGap: theme.spacing(2),
        [theme.breakpoints.down("md")]: {
          gridGap: theme.spacing(1),
        },
      }}
    >
      {eventsCalendarEnabled && <CurrentEventSelectWithDogs />}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
          {canCopyFromPrevious && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              loading={copyFromPreviousMutation.isPending}
              onClick={onCopyFromPrevious}
            >
              {t("tasksGrid.copyFromPrevious")}
            </Button>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<PictureAsPdfIcon />}
            onClick={onDownloadPdf}
          >
            {t("tasksGrid.downloadPdf")}
          </Button>
        </Stack>

        <TasksDragNDrop
          onTaskEditClick={onTaskEditClick}
          mappedTasks={mappedTasks}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        />
      </Box>

      <TaskForm
        open={taskFormOpen}
        onClose={onTaskFormClose}
        maxRowIndex={maxRowIndex}
        initialData={taskFormInitialData}
        editingId={taskEditingId}
      />

      {showPrintView && <TasksPrintView />}
    </Box>
  );
};

const Tasks = () => (
  <TaskPlanningProvider>
    <TasksBoard />
  </TaskPlanningProvider>
);

export default Tasks;
