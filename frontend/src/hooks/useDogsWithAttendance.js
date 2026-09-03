import { useAppContext } from "./useAppContext";
import { useEventsQuery } from "../queries/events";
import { useDogsQuery } from "../queries/dogs";

// Every dog, cross-referenced against event attendance + task planning.
export const useDogsWithAttendance = (selectedEventId) => {
  const { tasks } = useAppContext();
  const { data: events = [] } = useEventsQuery();
  const { data: dogs = [] } = useDogsQuery();

  if (!selectedEventId) return [];

  const event = events.find(({ _id }) => _id === selectedEventId);

  if (!event) return [];

  const isDogPlanned = (dogId) =>
    tasks.some(({ dogs: taskDogs }) =>
      taskDogs.some(({ _id: taskDogId }) => dogId === taskDogId)
    );

  return dogs.map((dog) => {
    const eventDogData = event.dogs.find(({ _id }) => _id === dog._id);
    const isPlanned = isDogPlanned(dog._id);

    if (!eventDogData?.status) return { ...dog, isPlanned };

    return { ...dog, status: eventDogData.status, isPlanned };
  });
};
