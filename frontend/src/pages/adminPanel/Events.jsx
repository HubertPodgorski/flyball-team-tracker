import React from "react";
import { Box, Card, IconButton, Typography, alpha, useTheme } from "@mui/material";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import DeleteIcon from "@mui/icons-material/Delete";
import EventForm from "../forms/EventForm";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { EventType } from "../../components/inputs/consts";
import { getBackgroundColorBasedOnType } from "../../helpers/calendar";
import { useEventsQuery, useDeleteEventMutation } from "../../queries/events";
import { formatDate } from "../../helpers/dateHelpers";
import EventTypeLegend from "../../components/EventTypeLegend";

const Events = () => {
  const theme = useTheme();
  const confirm = useConfirmModal();
  const { data: events = [] } = useEventsQuery();
  const deleteEventMutation = useDeleteEventMutation();

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
    try {
      await confirm();
    } catch {
      return;
    }

    deleteEventMutation.mutate(id);
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
        <EventTypeLegend />

        {events.map(({ name, _id, date, type }) => (
          <Card
            key={_id}
            onClick={() =>
              onEditClick({ name, date, type: type ?? EventType.TRAINING }, _id)
            }
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: theme.spacing(1, 2),
              cursor: "pointer",
              backgroundColor: alpha(getBackgroundColorBasedOnType(type), 0.75),
              backdropFilter: "blur(6px)",
            }}
          >
            <Typography>
              {name}: {formatDate(date, "dd/MM/yyyy HH:mm")}
            </Typography>

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
