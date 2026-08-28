import React from "react";
import { Box } from "@mui/material";
import { useFormHelpers } from "../hooks/useFormHelpers";
import TaskForm from "../pages/forms/TaskForm";

interface Props {
  columnIndex: number;
  rowIndex: number;
  positionIndex: number;
}

const AddTaskHereButton = ({ columnIndex, rowIndex, positionIndex }: Props) => {
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
          background: "#333",
          borderRadius: "6px",
          alignSelf: "flex-end",
          cursor: "pointer",
        }}
        onClick={() => setTaskFormOpen(true)}
      >
        Add task here
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
