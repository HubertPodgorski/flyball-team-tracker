import React, { useMemo } from "react";
import { Box, Card, Chip, IconButton, Typography, alpha, useTheme } from "@mui/material";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import EventForm from "../forms/EventForm";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { EventType } from "../../components/inputs/consts";
import { getBackgroundColorBasedOnType, getNextEvent } from "../../helpers/calendar";
import {
  useEventsQuery,
  useDeleteEventMutation,
  useSendEventReminderMutation,
} from "../../queries/events";
import { formatDate } from "../../helpers/dateHelpers";
import EventTypeLegend from "../../components/EventTypeLegend";

// Most events get created for the evening's training slot - default there
// instead of "right now" so trainers don't have to touch the time picker.
const getDefaultEventDate = () => {
  const date = new Date();
  date.setHours(17, 30, 0, 0);
  return date;
};

const Events = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const confirm = useConfirmModal();
  const { data: events = [] } = useEventsQuery();
  const deleteEventMutation = useDeleteEventMutation();
  const sendReminderMutation = useSendEventReminderMutation();
  const nextEvent = useMemo(() => getNextEvent(events), [events]);

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
    date: getDefaultEventDate(),
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

  const onSendReminderClick = (id) => {
    sendReminderMutation.mutate(id, {
      onSuccess: ({ remindedCount }) => {
        enqueueSnackbar(
          remindedCount > 0
            ? t("pages.events.reminderSent", { count: remindedCount })
            : t("pages.events.reminderSentNone"),
          { variant: "info" }
        );
      },
      onError: () => enqueueSnackbar(t("pages.events.reminderFailed"), { variant: "error" }),
    });
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

        {events.map(({ name, _id, date, type }) => {
          const isNextEvent = _id === nextEvent?._id;

          return (
            <Card
              key={_id}
              elevation={isNextEvent ? 8 : 1}
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
                ...(isNextEvent && {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: "2px",
                }),
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {isNextEvent && (
                  <Chip
                    label={t("pages.calendar.nextEvent")}
                    color="primary"
                    size="small"
                    sx={{ alignSelf: "flex-start" }}
                  />
                )}

                <Typography>
                  {name}: {formatDate(date, "dd/MM/yyyy HH:mm")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexShrink: 0 }}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    onSendReminderClick(_id);
                  }}
                  title={t("pages.events.sendReminder")}
                >
                  <NotificationsActiveIcon />
                </IconButton>

                <IconButton
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();

                    onDeleteClick(_id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          );
        })}
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
