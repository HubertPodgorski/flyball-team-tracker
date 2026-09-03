import React, { useMemo, useState } from "react";
import { useEventsQuery } from "../../queries/events";
import { Box, Pagination, useTheme } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import { startOfDay, endOfDay, isBefore, isAfter } from "date-fns";
import { sortByNewest } from "../../helpers/calendar";
import EventCard from "../../components/EventCard";
import EventTypeLegend from "../../components/EventTypeLegend";

const PAGE_SIZE = 10;

const Calendar = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const { data: events = [] } = useEventsQuery();

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [page, setPage] = useState(1);

  const filteredEvents = useMemo(() => {
    return events.filter(({ date }) => {
      const eventDate = new Date(date);

      // Both ends inclusive of the whole picked day - "From" already was
      // (start of that day onward), but "To" compared against midnight at
      // the *start* of the picked day, excluding every event later that
      // same day (e.g. picking today would hide an event happening tonight).
      if (fromDate && isBefore(eventDate, startOfDay(fromDate))) return false;
      if (toDate && isAfter(eventDate, endOfDay(toDate))) return false;

      return true;
    });
  }, [events, fromDate, toDate]);

  // The next event on/after right now - pinned above the paginated list so
  // it's never buried by however many events the club has piled up. Only
  // ever the next one, not just "nearest in either direction" - a past event
  // isn't what you need quick access to.
  const nextEvent = useMemo(() => {
    const today = startOfDay(new Date());

    return filteredEvents
      .filter(({ date }) => !isBefore(new Date(date), today))
      .sort((eventA, eventB) => new Date(eventA.date) - new Date(eventB.date))[0];
  }, [filteredEvents]);

  const restEvents = useMemo(
    () =>
      filteredEvents
        .filter((event) => event._id !== nextEvent?._id)
        .sort(sortByNewest),
    [filteredEvents, nextEvent]
  );

  const pageCount = Math.max(1, Math.ceil(restEvents.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedEvents = restEvents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const onDateFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <EventTypeLegend />

      <Box sx={{ display: "flex", gap: 1, flexWrap: "nowrap", width: "100%", maxWidth: 600 }}>
        <DatePicker
          label={t("pages.calendar.from")}
          value={fromDate}
          onChange={onDateFilterChange(setFromDate)}
          sx={{ flex: 1, minWidth: 0 }}
          slotProps={{ field: { clearable: true }, textField: { size: "small" } }}
        />

        <DatePicker
          label={t("pages.calendar.to")}
          value={toDate}
          onChange={onDateFilterChange(setToDate)}
          sx={{ flex: 1, minWidth: 0 }}
          slotProps={{ field: { clearable: true }, textField: { size: "small" } }}
        />
      </Box>

      {nextEvent && <EventCard event={nextEvent} highlighted />}

      {filteredEvents.length === 0 && (
        <Box sx={{ color: "text.secondary" }}>{t("pages.calendar.noEventsInRange")}</Box>
      )}

      <Box
        data-testid="calendar-page"
        sx={{
          display: "grid",
          gridAutoFlow: "row",
          gridGap: theme.spacing(2),

          [theme.breakpoints.down("md")]: {
            gridGap: theme.spacing(1),
          },
        }}
      >
        {pagedEvents.map((event) => (
          <EventCard event={event} key={event._id} />
        ))}
      </Box>

      {pageCount > 1 && (
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={(_event, value) => setPage(value)}
          sx={{ alignSelf: "center" }}
        />
      )}
    </Box>
  );
};

export default Calendar;
