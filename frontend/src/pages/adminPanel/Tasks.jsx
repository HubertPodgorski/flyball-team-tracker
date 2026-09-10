import React, { useState } from "react";
import { flushSync } from "react-dom";
import { useGetMappedTasks } from "../../hooks/useGetMappedTasks";
import { Box, Button, Stack, useTheme } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useTranslation } from "react-i18next";
import TaskForm from "../forms/TaskForm";
import { useGetMaxRowIndex } from "../../hooks/useGetMaxRowIndex";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import TasksDragNDrop from "../../components/admin/TasksDragNDrop";
import CurrentEventSelectWithDogs from "../../components/admin/CurrentEventSelectWithDogs";
import TasksPrintView from "../../components/tasksGrid/TasksPrintView";
import { TaskPlanningProvider } from "../../contexts/TaskPlanningContext";
import { useClubFeatures } from "../../hooks/useClubFeatures";

const Tasks = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  // TODO: load tasks from template

  const { eventsCalendar: eventsCalendarEnabled } = useClubFeatures();
  const [isDragging, setIsDragging] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const { mappedTasks } = useGetMappedTasks(true, isDragging);
  const maxRowIndex = useGetMaxRowIndex(mappedTasks);

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
    <TaskPlanningProvider>
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
          <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
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
    </TaskPlanningProvider>
  );
};

export default Tasks;
