import React from "react";
import { Box, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useFormHelpers } from "../hooks/useFormHelpers";
import TaskForm from "../pages/forms/TaskForm";

interface Props {
  columnIndex: number;
  rowIndex: number;
  positionIndex: number;
}

const AddTaskHereButton = ({ columnIndex, rowIndex, positionIndex }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    editingId: taskEditingId,
    formOpen: taskFormOpen,
    setFormOpen: setTaskFormOpen,
    onFormClose: onTaskFormClose,
    formInitialData: taskFormInitialData,
  } = useFormHelpers({
    description: "",
    dogs: [],
    position: { columnIndex, rowIndex, positionIndex },
  });

  return (
    <>
      <Box
        sx={{
          padding: 1,
          background: "transparent",
          border: `1px solid ${theme.palette.primary.main}`,
          color: theme.palette.primary.main,
          borderRadius: "6px",
          width: "100%",
          textAlign: "center",
          cursor: "pointer",
        }}
        onClick={() => setTaskFormOpen(true)}
      >
        {t("tasksGrid.addTaskHere")}
      </Box>

      <TaskForm
        open={taskFormOpen}
        onClose={onTaskFormClose}
        initialData={taskFormInitialData}
        editingId={taskEditingId}
      />
    </>
  );
};

export default AddTaskHereButton;
