import React from "react";
import { alpha } from "@mui/material";
import { useTranslation } from "react-i18next";
import Legend from "./Legend";
import { getEventTypeOptions } from "./inputs/consts";
import { getBackgroundColorBasedOnType } from "../helpers/calendar";

// Same 0.75 alpha as the actual event card background - a flat, full-opacity dot read as a different, wrong color.
const EventTypeLegend = () => {
  const { t } = useTranslation();

  return (
    <Legend
      items={getEventTypeOptions(t).map(({ value, label }) => ({
        label,
        color: alpha(getBackgroundColorBasedOnType(value), 0.75),
      }))}
    />
  );
};

export default EventTypeLegend;
