import React, { useState } from "react";
import { useGetMappedTasks } from "../../hooks/useGetMappedTasks";
import { Box, useTheme } from "@mui/material";
import TaskForm from "../forms/TaskForm";
import { useGetMaxRowIndex } from "../../hooks/useGetMaxRowIndex";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import TasksDragNDrop from "../../components/admin/TasksDragNDrop";
import CurrentEventSelectWithDogs from "../../components/admin/CurrentEventSelectWithDogs";
import LineupTaskLegend from "../../components/LineupTaskLegend";
import { TaskPlanningProvider } from "../../contexts/TaskPlanningContext";

const Tasks = () => {
  const theme = useTheme();
  // TODO: load tasks from template

  const [isDragging, setIsDragging] = useState(false);
  const { mappedTasks } = useGetMappedTasks(true, isDragging);
  const maxRowIndex = useGetMaxRowIndex(mappedTasks);

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
        <CurrentEventSelectWithDogs />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <LineupTaskLegend />

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
      </Box>
    </TaskPlanningProvider>
  );
};

export default Tasks;
