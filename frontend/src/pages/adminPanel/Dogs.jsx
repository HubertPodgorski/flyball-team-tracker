import React from "react";
import DogForm from "../forms/DogForm";
import { IconButton, List, ListItem, ListItemButton } from "@mui/material";
import CenteredContent from "../../components/CenteredContent";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useAppContext } from "../../hooks/useAppContext";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useSocketContext } from "../../hooks/useSocketContext";

const Dogs = () => {
  const { socket } = useSocketContext();
  const { dogs } = useAppContext();
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
    dogs: [],
  });

  const onDeleteClick = async (id) => {
    await confirm();

    socket.emit("delete_dog", { _id: id });
  };

  return (
    <>
      <CenteredContent sx={{ marginBottom: `${FAB_CONTENT_CLEARANCE}px` }}>
        <List>
          {dogs.map(({ name, _id }) => (
            <ListItem
              divider
              key={_id}
              onClick={() => onEditClick({ name }, _id)}
            >
              {/*TODO: do edit*/}
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

      <DogForm
        onClose={onFormClose}
        open={formOpen}
        initialData={formInitialData}
        editingId={editingId}
      />
    </>
  );
};

export default Dogs;
