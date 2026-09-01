import React from "react";
import Legend from "./Legend";
import { eventTypeOptions } from "./inputs/consts";
import { getBackgroundColorBasedOnType } from "../helpers/calendar";

const EventTypeLegend = () => (
  <Legend
    items={eventTypeOptions.map(({ value, label }) => ({
      label,
      color: getBackgroundColorBasedOnType(value),
    }))}
  />
);

export default EventTypeLegend;
