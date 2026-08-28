import React from "react";
import { useGetMappedTasks } from "../../hooks/useGetMappedTasks";
import { Box, Button, useTheme } from "@mui/material";
import TaskForm from "../forms/TaskForm";
import { useGetMaxRowIndex } from "../../hooks/useGetMaxRowIndex";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import ButtonsGrid from "../../components/ButtonsGrid";
import SaveEventAsTemplateButton from "../../components/admin/SaveEventAsTemplateButton";
import TasksDragNDrop from "../../components/admin/TasksDragNDrop";
import CurrentEventSelectWithDogs from "../../components/admin/CurrentEventSelectWithDogs";
import EventTemplateSelector from "../../components/admin/EventTemplateSelector";

const Tasks = () => {
  const theme = useTheme();
  // TODO: load tasks from template

  const { mappedTasks, setMappedTasks } = useGetMappedTasks(true);
  const maxRowIndex = useGetMaxRowIndex(mappedTasks);

  const {
    editingId: taskEditingId,
    formOpen: taskFormOpen,
    setFormOpen: setTaskFormOpen,
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
      <EventTemplateSelector />

      <CurrentEventSelectWithDogs />

      <TasksDragNDrop
        onTaskEditClick={onTaskEditClick}
        mappedTasks={mappedTasks}
        setMappedTasks={setMappedTasks}
      />

      <ButtonsGrid>
        <Button
          variant="contained"
          color="success"
          onClick={() => setTaskFormOpen(true)}
        >
          Add
        </Button>

        <SaveEventAsTemplateButton />
      </ButtonsGrid>

      <TaskForm
        open={taskFormOpen}
        onClose={onTaskFormClose}
        maxRowIndex={maxRowIndex}
        initialData={taskFormInitialData}
        editingId={taskEditingId}
      />
    </Box>
  );
};

export default Tasks;
