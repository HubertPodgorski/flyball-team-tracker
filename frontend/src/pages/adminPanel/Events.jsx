import React from "react";
import { IconButton, List, ListItem, ListItemButton } from "@mui/material";
import CenteredContent from "../../components/CenteredContent";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import DeleteIcon from "@mui/icons-material/Delete";
import EventForm from "../forms/EventForm";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useAppContext } from "../../hooks/useAppContext";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { EventType } from "../../components/inputs/consts";
import { getBackgroundColorBasedOnType } from "../../helpers/calendar";
import { useSocketContext } from "../../hooks/useSocketContext";
import { formatDate } from "../../helpers/dateHelpers";

const Events = () => {
  const { socket } = useSocketContext();
  const confirm = useConfirmModal();
  const { events } = useAppContext();

  const {
    formInitialData,
    editingId,
    formOpen,
    setFormOpen,
    onEditClick,
    onFormClose,
  } = useFormHelpers({
    type: EventType.TRAINING,
    name: "",
    date: new Date().toString(),
    dogs: [],
  });

  const onDeleteClick = async (id) => {
    await confirm();

    socket.emit("delete_event", { _id: id });
  };

  return (
    <>
      <CenteredContent sx={{ marginBottom: `${FAB_CONTENT_CLEARANCE}px` }}>
        <List>
          {events.map(({ name, _id, date, type }) => (
            <ListItem
              sx={{ backgroundColor: getBackgroundColorBasedOnType(type) }}
              divider
              key={_id}
              onClick={() =>
                onEditClick({ name, date, type: type ?? EventType.TRAINING }, _id)
              }
            >
              {/*TODO: do edit*/}
              <ListItemButton>
                {name}: {formatDate(date, "dd/MM/yyyy HH:mm")}
              </ListItemButton>

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

      <EventForm
        onClose={onFormClose}
        open={formOpen}
        initialData={formInitialData}
        editingId={editingId}
      />
    </>
  );
};

export default Events;
