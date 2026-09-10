import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
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

  const [selectedEvent, setSelectedEvent] = useState("");
  const nextEvent = useMemo(() => getNextEvent(events), [events]);

  // Preselect the nearest upcoming event once the events list has settled, the same way the calendar highlights it.
  // Fires exactly once per mount so a later live update to the events list never yanks the board to a different session.
  const didPreselect = useRef(false);
  useEffect(() => {
    if (didPreselect.current || !eventsLoaded) return;

    didPreselect.current = true;

    if (nextEvent) setSelectedEvent(nextEvent._id);
  }, [eventsLoaded, nextEvent]);

  // Bridge the pick into TaskPlanningContext - shared with TaskForm and the board.
  useEffect(() => {
    setSelectedEventId(selectedEvent);
  }, [selectedEvent, setSelectedEventId]);

  const dogsWithAttendance = useDogsWithAttendance(selectedEvent);

  const labelFor = (event) => {
    const base = `${event.name} ${getFormattedDate(event.date)}`;

    return event._id === nextEvent?._id ? `${base} · ${t("pages.calendar.nextEvent")}` : base;
  };

  return (
    <>
      <FormControl fullWidth>
        <InputLabel id="task-event-select-label">{t("tasksGrid.eventLabel")}</InputLabel>
        <Select
          labelId="task-event-select-label"
          label={t("tasksGrid.eventLabel")}
          value={selectedEvent}
          onChange={(event) => setSelectedEvent(event.target.value)}
        >
          <MenuItem value="">{t("tasksGrid.noneOption")}</MenuItem>
          {events.map((event) => (
            <MenuItem key={event._id} value={event._id}>
              {labelFor(event)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {dogsWithAttendance.length > 0 && (
        <>
          <DogPlanningLegend />

          {/* Grouped so the layout gap above doesn't also land between label and chips. */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {t("common.dogs")}
            </Typography>

            <DogAttendanceChips dogsWithAttendance={dogsWithAttendance} showIfPlanned />
          </Box>
        </>
      )}
    </>
  );
};

export default CurrentEventSelectWithDogs;
