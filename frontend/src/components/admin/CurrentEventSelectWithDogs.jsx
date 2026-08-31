import React, { useEffect } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { Box, Typography } from "@mui/material";
import FormSelect from "../inputs/FormSelect";
import { getFormattedDate } from "../../helpers/calendar";
import { useAppContext } from "../../hooks/useAppContext";
import { useDogsWithAttendance } from "../../hooks/useDogsWithAttendance";
import { useTaskPlanningContext } from "../../hooks/useTaskPlanningContext";
import DogAttendanceChips from "../DogAttendanceChips";
import DogPlanningLegend from "../DogPlanningLegend";

const CurrentEventSelectWithDogs = () => {
  const { events } = useAppContext();
  const { setSelectedEventId } = useTaskPlanningContext();

  const form = useForm({
    defaultValues: { event: [] },
  });

  const selectedEvent = useStore(form.store, (state) => state.values.event);

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
        label="Event"
        options={[
          { value: "", label: "Brak" },
          ...events.map(({ name, _id: value, date }) => ({
            value,
            label: `${name} ${getFormattedDate(date)}`,
          })),
        ]}
      />

      {dogsWithAttendance.length > 0 && (
        <>
          <DogPlanningLegend />

          {/* Grouped so the layout gap above doesn't also land between label and chips. */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Dogs
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
