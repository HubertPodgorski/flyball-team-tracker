import React, { useEffect, useMemo, useRef } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import FormSelect from "../inputs/FormSelect";
import { getFormattedDate, getNextEvent } from "../../helpers/calendar";
import { useEventsQuery } from "../../queries/events";
import { useDogsWithAttendance } from "../../hooks/useDogsWithAttendance";
import { useTaskPlanningContext } from "../../hooks/useTaskPlanningContext";
import DogAttendanceChips from "../DogAttendanceChips";
import DogPlanningLegend from "../DogPlanningLegend";

const CurrentEventSelectWithDogs = () => {
  const { t } = useTranslation();
  const { data: events = [], isSuccess: eventsLoaded } = useEventsQuery();
  const { setSelectedEventId } = useTaskPlanningContext();

  const form = useForm({
    defaultValues: { event: "" },
  });

  const selectedEvent = useStore(form.store, (state) => state.values.event);
  const nextEvent = useMemo(() => getNextEvent(events), [events]);

  // Preselect the nearest upcoming event once the events list has settled, the same way the calendar highlights it.
  // Fires exactly once per mount so a later live update to the events list never yanks the board to a different session.
  const didPreselect = useRef(false);
  useEffect(() => {
    if (didPreselect.current || !eventsLoaded) return;

    didPreselect.current = true;

    if (nextEvent) form.setFieldValue("event", nextEvent._id);
  }, [eventsLoaded, nextEvent, form]);

  // Shared with TaskForm's dog select - see TaskPlanningContext.
  useEffect(() => {
    setSelectedEventId(selectedEvent);
  }, [selectedEvent, setSelectedEventId]);

  const dogsWithAttendance = useDogsWithAttendance(selectedEvent);

  return (
    <>
      <FormSelect
        form={form}
        multi={false}
        name="event"
        label={t("tasksGrid.eventLabel")}
        options={[
          { value: "", label: t("tasksGrid.noneOption") },
          ...events.map(({ name, _id: value, date }) => ({
            value,
            label:
              value === nextEvent?._id
                ? `${name} ${getFormattedDate(date)} · ${t("pages.calendar.nextEvent")}`
                : `${name} ${getFormattedDate(date)}`,
          })),
        ]}
      />

      {dogsWithAttendance.length > 0 && (
        <>
          <DogPlanningLegend />

          {/* Grouped so the layout gap above doesn't also land between label and chips. */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {t("common.dogs")}
            </Typography>

            <DogAttendanceChips
              dogsWithAttendance={dogsWithAttendance}
              showIfPlanned
            />
          </Box>
        </>
      )}
    </>
  );
};

export default CurrentEventSelectWithDogs;
