import React from "react";
import { IconButton, List, ListItem, ListItemButton } from "@mui/material";
import CenteredContent from "../../components/CenteredContent";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useAppContext } from "../../hooks/useAppContext";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import DogTaskForm from "../forms/DogTaskForm";
import { useSocketContext } from "../../hooks/useSocketContext";

const DogTasks = () => {
  const { socket } = useSocketContext();
  const { dogTasks } = useAppContext();
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
    await confirm();

    socket.emit("delete_dog_task", { _id: id });
  };

  return (
    <>
      <CenteredContent sx={{ marginBottom: `${FAB_CONTENT_CLEARANCE}px` }}>
        <List>
          {dogTasks.map(({ name, _id }) => (
            <ListItem
              divider
              key={_id}
              onClick={() => onEditClick({ name }, _id)}
            >
              <ListItemButton>{name}</ListItemButton>

              <IconButton
                color="error"
                onClick={(event) => {
                  event.stopPropagation();

                  onDeleteClick(_id);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </CenteredContent>

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
