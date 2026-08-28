import React from "react";
import { Box, Chip } from "@mui/material";
import ChipsGrid from "./ChipsGrid";
import { DogWithAttendanceAndPlannedInfo } from "../helpers/types";
import { getColorsByStatus, sortByAttendance } from "../helpers/calendar";

interface Props {
  dogsWithAttendance: DogWithAttendanceAndPlannedInfo[];
  showIfPlanned?: boolean;
}

const DogAttendanceChips = ({ dogsWithAttendance, showIfPlanned }: Props) => {
  const sortedDogsByAttendance = dogsWithAttendance.sort(sortByAttendance);

  return (
    <ChipsGrid>
      {sortedDogsByAttendance.map(({ name, _id, status, isPlanned }) => {
        const { color, background } = getColorsByStatus(status);

        return (
          <Box sx={{ position: "relative" }} key={_id}>
            {showIfPlanned && !isPlanned && (
              <Box
                sx={{
                  background: "#fff",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  position: "absolute",
                  top: 0,
                  right: 0,
                  border: "1px solid #333",
                }}
              />
            )}

            <Chip
              label={name}
              key={_id}
              sx={{
                background,
                color,
              }}
            />
          </Box>
        );
      })}
    </ChipsGrid>
  );
};

export default DogAttendanceChips;
