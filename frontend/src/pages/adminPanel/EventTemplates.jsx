import React from "react";
import { IconButton, List, ListItem, ListItemButton } from "@mui/material";
import CenteredContent from "../../components/CenteredContent";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useAppContext } from "../../hooks/useAppContext";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import EventTemplateForm from "../forms/EventTemplateForm";
import { useSocketContext } from "../../hooks/useSocketContext";

const EventTemplates = () => {
  const { socket } = useSocketContext();
  const { eventTemplates } = useAppContext();
  const confirm = useConfirmModal();

  const {
    formInitialData,
    editingId,
    formOpen,
    onEditClick,
    onFormClose,
  } = useFormHelpers({
    name: "",
  });

  const onDeleteClick = async (id) => {
    await confirm();

    socket.emit("delete_event_template", { _id: id });
  };

  return (
    <>
      <CenteredContent>
        <List>
          {eventTemplates.map(({ name, _id }) => (
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

      <EventTemplateForm
        onClose={onFormClose}
        open={formOpen}
        initialData={formInitialData}
        editingId={editingId}
      />
    </>
  );
};

export default EventTemplates;
