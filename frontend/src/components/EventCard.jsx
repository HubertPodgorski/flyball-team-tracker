import React from "react";
import { alpha, Card, Chip, Typography, useTheme } from "@mui/material";
import { useIsMobile } from "../hooks/useIsMobile";
import EventDetails from "./EventDetails";
import {
  getBackgroundColorBasedOnType,
  getFormattedDate,
} from "../helpers/calendar";

// `highlighted` marks the pinned "next event" (orange outline + label
// chip); `targeted` marks a deep-linked notification click instead, in a
// different color (blue) - the two aren't always the same event.
const EventCard = ({
  event: { _id, name, date, dogs, users, type },
  highlighted,
  label,
  expandDetails,
  targeted,
}) => {
  const isMobile = useIsMobile();
  const theme = useTheme();

  const outlineColor = highlighted
    ? theme.palette.primary.main
    : targeted
      ? theme.palette.info.main
      : undefined;

  return (
    <Card
      key={_id}
      id={`event-${_id}`}
      elevation={outlineColor ? 8 : 1}
      sx={{
        padding: theme.spacing(2),
        display: "grid",
        gridAutoFlow: "rows",
        gridGap: theme.spacing(2),
        backgroundColor: alpha(getBackgroundColorBasedOnType(type), 0.75),
        backdropFilter: "blur(6px)",
        ...(outlineColor && {
          outline: `2px solid ${outlineColor}`,
          outlineOffset: "2px",
        }),
        [theme.breakpoints.down("md")]: {
          padding: theme.spacing(1),
          gridGap: theme.spacing(1),
        },
      }}
    >
      {label && (
        <Chip
          label={label}
          color="primary"
          size="small"
          sx={{ justifySelf: "flex-start" }}
        />
      )}

      <Typography variant={isMobile ? "body1" : "h5"}>{name}</Typography>

      <Typography
        variant={isMobile ? "body2" : "body1"}
        sx={{ textTransform: "uppercase" }}
      >
        {getFormattedDate(date)}
      </Typography>

      <EventDetails users={users} dogs={dogs} id={_id} startOpen={expandDetails} />
    </Card>
  );
};

export default EventCard;
