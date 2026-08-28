import React from "react";
import { useForm, useStore } from "@tanstack/react-form";
import FormSelect from "../inputs/FormSelect";
import { getFormattedDate } from "../../helpers/calendar";
import { useAppContext } from "../../hooks/useAppContext";
import DogAttendanceChips from "../DogAttendanceChips";

const CurrentEventSelectWithDogs = () => {
  const { events, tasks, dogs } = useAppContext();

  const form = useForm({
    defaultValues: { event: [] },
  });

  const selectedEvent = useStore(form.store, (state) => state.values.event);

  const getSelectedEventDogs = () => {
    if (!selectedEvent) return [];

    const event = events.find(({ _id }) => _id === selectedEvent);

    if (!event) return [];

    return event.dogs.map((eventDogData) => {
      const foundDog = dogs.find(
        ({ _id: dogId }) => eventDogData._id === dogId
      );

      if (!foundDog) return eventDogData;

      return { ...foundDog, status: eventDogData.status };
    });
  };

  const selectedEventDogs = getSelectedEventDogs();

  const isDogPlanned = (dogId) =>
    tasks.some(({ dogs }) =>
      dogs.some(({ _id: taskDogId }) => dogId === taskDogId)
    );

  const getDogsWithAttendance = () => {
    if (!selectedEvent) return [];

    const event = events.find(({ _id }) => _id === selectedEvent);

    if (!event) return [];

    return dogs.map((dog) => {
      const dogFound = selectedEventDogs.find(
        ({ _id: currentEventDogId }) => currentEventDogId === dog._id
      );

      const isPlanned = isDogPlanned(dog._id);

      if (!dogFound || !dogFound.status) return { ...dog, isPlanned };

      return {
        ...dog,
        status: dogFound.status,
        isPlanned,
      };
    });
  };

  const dogsWithAttendance = getDogsWithAttendance();

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
        <DogAttendanceChips
          dogsWithAttendance={dogsWithAttendance}
          showIfPlanned
        />
      )}
    </>
  );
};

export default CurrentEventSelectWithDogs;
