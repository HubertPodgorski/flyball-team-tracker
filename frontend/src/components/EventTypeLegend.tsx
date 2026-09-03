import React from "react";
import { useTranslation } from "react-i18next";
import Legend from "./Legend";
import { getEventTypeOptions } from "./inputs/consts";
import { getBackgroundColorBasedOnType } from "../helpers/calendar";

const EventTypeLegend = () => {
  const { t } = useTranslation();

  return (
    <Legend
      items={getEventTypeOptions(t).map(({ value, label }) => ({
        label,
        color: getBackgroundColorBasedOnType(value),
      }))}
    />
  );
};

export default EventTypeLegend;
