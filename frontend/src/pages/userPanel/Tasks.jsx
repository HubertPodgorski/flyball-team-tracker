import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import TasksMainGrid from "../../components/tasksGrid/TasksMainGrid";
import TasksRow from "../../components/tasksGrid/TasksRow";
import TasksColumn from "../../components/tasksGrid/TasksColumn";
import { useGetMappedTasks } from "../../hooks/useGetMappedTasks";
import DogsTaskCell from "../../components/DogsTaskCell";
import { useEventsQuery } from "../../queries/events";
import { useClubFeatures } from "../../hooks/useClubFeatures";
import { getNextEvent } from "../../helpers/calendar";

const Tasks = () => {
  const { data: events = [], isSuccess: eventsLoaded } = useEventsQuery();
  const { eventsCalendar } = useClubFeatures();

  // Users only ever see one board - the plan for the nearest upcoming session, or the default board otherwise.
  // Resolved once on the first settled fetch so a later live update to the events list doesn't switch the board mid-view.
  const [eventId, setEventId] = useState(null);

  useEffect(() => {
    if (eventId !== null || !eventsLoaded) return;

    setEventId(eventsCalendar ? getNextEvent(events)?._id ?? "none" : "none");
  }, [eventId, eventsLoaded, eventsCalendar, events]);

  const { mappedTasks } = useGetMappedTasks(false, false, eventId ?? "none");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <TasksMainGrid>
        {Object.entries(mappedTasks).map(([rowIndex, columns]) => (
          <TasksRow key={rowIndex} userPanel>
            {Object.entries(columns).map(([columnIndex, items]) => (
              <TasksColumn columnIndex={columnIndex} key={columnIndex}>
                {items.map((item, index) => (
                  <DogsTaskCell item={item} key={item._id} index={index} />
                ))}
              </TasksColumn>
            ))}
          </TasksRow>
        ))}
      </TasksMainGrid>
    </Box>
  );
};

export default Tasks;
