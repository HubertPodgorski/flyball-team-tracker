import React from "react";
import { Chip } from "@mui/material";
import ChipsGrid from "./ChipsGrid";
import { DogWithAttendanceAndPlannedInfo } from "../helpers/types";
import {
  getColorsByStatus,
  getDogPlanningColor,
  sortByAttendance,
} from "../helpers/calendar";

interface Props {
  dogsWithAttendance: DogWithAttendanceAndPlannedInfo[];
  // Planning-vs-attendance coloring (see getDogPlanningColor); plain attendance color otherwise.
  showIfPlanned?: boolean;
}

const DogAttendanceChips = ({ dogsWithAttendance, showIfPlanned }: Props) => {
  const sortedDogsByAttendance = dogsWithAttendance.sort(sortByAttendance);

  return (
    <ChipsGrid hideIcon={showIfPlanned}>
      {sortedDogsByAttendance.map(({ name, _id, status, isPlanned }) => {
        if (showIfPlanned) {
          const planningColor = getDogPlanningColor(isPlanned, status);

          return (
            <Chip
              label={name}
              key={_id}
              color={planningColor ?? "default"}
            />
          );
        }

        const { color, background } = getColorsByStatus(status);

        return (
          <Chip label={name} key={_id} sx={{ background, color }} />
        );
      })}
    </ChipsGrid>
  );
};

export default DogAttendanceChips;
