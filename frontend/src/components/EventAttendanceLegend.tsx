import React from "react";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import Legend from "./Legend";
import { ATTENDANCE_ABSENT_RED } from "../helpers/calendar";

// Colors match getColorsByStatus - present/absent/unset, the three states a tapped name cycles through.
const EventAttendanceLegend = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Legend
      items={[
        { label: t("legends.present"), color: theme.palette.success.main },
        { label: t("legends.absent"), color: ATTENDANCE_ABSENT_RED },
        { label: t("legends.unset"), color: theme.palette.warning.main },
      ]}
    />
  );
};

export default EventAttendanceLegend;
