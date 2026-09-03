import React from "react";
import { Box, Card, IconButton, Typography, alpha, useTheme } from "@mui/material";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import DogTaskForm from "../forms/DogTaskForm";
import { useDogTasksQuery, useDeleteDogTaskMutation } from "../../queries/dogTasks";

const DogTasks = () => {
  const theme = useTheme();
  const { data: dogTasks = [] } = useDogTasksQuery();
  const deleteDogTaskMutation = useDeleteDogTaskMutation();
  const confirm = useConfirmModal();

  const {
    formInitialData,
    editingId,
    formOpen,
    setFormOpen,
    onEditClick,
    onFormClose,
  } = useFormHelpers({
    name: "",
  });

  const onDeleteClick = async (id) => {
    try {
      await confirm();
    } catch {
      return;
    }

    deleteDogTaskMutation.mutate(id);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          marginBottom: `${FAB_CONTENT_CLEARANCE}px`,
        }}
      >
        {dogTasks.map(({ name, _id }) => (
          <Card
            key={_id}
            onClick={() => onEditClick({ name }, _id)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: theme.spacing(1, 2),
              cursor: "pointer",
              backgroundColor: alpha(theme.palette.background.paper, 0.75),
              backdropFilter: "blur(6px)",
            }}
          >
            <Typography>{name}</Typography>

            <IconButton
              color="error"
              onClick={(event) => {
                event.stopPropagation();

                onDeleteClick(_id);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Card>
        ))}
      </Box>

      <AddFab onClick={() => setFormOpen(true)} />

      <DogTaskForm
        onClose={onFormClose}
        open={formOpen}
        initialData={formInitialData}
        editingId={editingId}
      />
    </>
  );
};

export default DogTasks;
