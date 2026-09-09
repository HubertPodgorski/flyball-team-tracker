import React, { useEffect, useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { useEventsQuery } from "../../queries/events";
import { Box, Pagination, Tab, Tabs, useTheme } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import { startOfDay, endOfDay, isBefore, isAfter } from "date-fns";
import { splitUpcomingAndPast } from "../../helpers/calendar";
import EventCard from "../../components/EventCard";
import EventTypeLegend from "../../components/EventTypeLegend";

const PAGE_SIZE = 10;

const Calendar = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Present only when arriving from a push notification's "click" (see
  // serviceWorker.js) - jumps straight to that specific event below.
  const { eventId: targetEventId } = useSearch({ from: "/user-panel/calendar" });

  const { data: events = [] } = useEventsQuery();

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [page, setPage] = useState(1);

  // A deep-linked event must never be hidden by a stale filter left over
  // from a previous visit to this page.
  useEffect(() => {
    if (!targetEventId) return;

    setFromDate(null);
    setToDate(null);
  }, [targetEventId]);

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

  const { upcoming, past } = useMemo(() => splitUpcomingAndPast(filteredEvents), [filteredEvents]);
  const activeEvents = activeTab === "upcoming" ? upcoming : past;

  // A deep-linked event can land on either tab - switch to whichever one actually has it.
  useEffect(() => {
    if (!targetEventId) return;

    if (upcoming.some((event) => event._id === targetEventId)) setActiveTab("upcoming");
    else if (past.some((event) => event._id === targetEventId)) setActiveTab("past");
  }, [targetEventId, upcoming, past]);

  const pageCount = Math.max(1, Math.ceil(activeEvents.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedEvents = activeEvents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // The deep-linked event might be right on this page already, or buried further into the now-active tab's list.
  useEffect(() => {
    if (!targetEventId) return;

    const targetIndex = activeEvents.findIndex((event) => event._id === targetEventId);

    if (targetIndex === -1) return;

    setPage(Math.floor(targetIndex / PAGE_SIZE) + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetEventId, activeEvents]);

  useEffect(() => {
    if (!targetEventId) return;

    document
      .getElementById(`event-${targetEventId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetEventId, pagedEvents]);

  const onDateFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const onTabChange = (_event, value) => {
    setActiveTab(value);
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

      <Tabs value={activeTab} onChange={onTabChange}>
        <Tab value="upcoming" label={t("pages.calendar.upcomingTab")} />
        <Tab value="past" label={t("pages.calendar.pastTab")} />
      </Tabs>

      {activeEvents.length === 0 && (
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
        {pagedEvents.map((event, index) => {
          // The soonest upcoming event (page 1 of that tab only) keeps the pinned "Next event" treatment.
          const isNext = activeTab === "upcoming" && currentPage === 1 && index === 0;

          return (
            <EventCard
              event={event}
              key={event._id}
              highlighted={isNext && event._id !== targetEventId}
              targeted={event._id === targetEventId}
              label={isNext ? t("pages.calendar.nextEvent") : undefined}
              expandDetails={event._id === targetEventId}
            />
          );
        })}
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
