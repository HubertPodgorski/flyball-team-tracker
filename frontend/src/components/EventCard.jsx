import React from "react";
import { alpha, Card, Chip, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "../hooks/useIsMobile";
import EventDetails from "./EventDetails";
import {
  getBackgroundColorBasedOnType,
  getFormattedDate,
} from "../helpers/calendar";

const EventCard = ({ event: { _id, name, date, dogs, users, type }, highlighted }) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const theme = useTheme();

  return (
    <Card
      key={_id}
      elevation={highlighted ? 8 : 1}
      sx={{
        padding: theme.spacing(2),
        display: "grid",
        gridAutoFlow: "rows",
        gridGap: theme.spacing(2),
        backgroundColor: alpha(getBackgroundColorBasedOnType(type), 0.75),
        backdropFilter: "blur(6px)",
        ...(highlighted && {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: "2px",
        }),
        [theme.breakpoints.down("md")]: {
          padding: theme.spacing(1),
          gridGap: theme.spacing(1),
        },
      }}
    >
      {highlighted && (
        <Chip
          label={t("pages.calendar.nextEvent")}
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

      <EventDetails users={users} dogs={dogs} id={_id} />
    </Card>
  );
};

export default EventCard;
