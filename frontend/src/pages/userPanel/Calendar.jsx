import React, { useMemo } from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { Box, useTheme } from "@mui/material";
import { sortByNewest } from "../../helpers/calendar";
import EventCard from "../../components/EventCard";

const Calendar = () => {
  const theme = useTheme();

  const { events } = useAppContext();

  const sortedEvents = useMemo(() => events.sort(sortByNewest), [events]);

  return (
    <Box
      sx={{
        display: "grid",
        gridAutoFlow: "row",
        gridGap: theme.spacing(2),

        [theme.breakpoints.down("md")]: {
          gridGap: theme.spacing(1),
        },
      }}
    >
      {sortedEvents.map((event) => (
        <EventCard event={event} key={event._id} />
      ))}
    </Box>
  );
};

export default Calendar;
