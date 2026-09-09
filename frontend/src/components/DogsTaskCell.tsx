import React, { useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaskCell from "./tasksGrid/TaskCell";
import { useAuthContext } from "../hooks/useAuthContext";
import { isMyDog } from "../helpers/tasks";
import { useIsMobile } from "../hooks/useIsMobile";
import { Dog, Task } from "../helpers/types";
import { findLinkedLineup } from "../helpers/lineupLink";
import { useTeamsQuery } from "../queries/teams";
import TaskLineupModal from "./teams/TaskLineupModal";
import DogDetailsModal from "./modals/DogDetailsModal";

// TODO: type me
interface Props {
  item: Task;
  index: number;
}

const DogsTaskCell = ({ item, index }: Props) => {
  const { _id, dogs, description } = item;
  const { t } = useTranslation();
  const [dogDetailsId, setDogDetailsId] = useState<string | undefined>();
  const [isLineupModalOpen, setIsLineupModalOpen] = useState(false);

  const isMobile = useIsMobile();
  const { user } = useAuthContext();
  const { data: teams = [] } = useTeamsQuery();

  const linked = findLinkedLineup(item, teams);

  return (
    <>
      <TaskCell
        index={index}
        id={_id}
        key={_id}
        lineupLinked={!!linked}
        onClick={linked ? () => setIsLineupModalOpen(true) : undefined}
      >
        {description && (
          <Typography variant={isMobile ? "body2" : "h5"}>
            {description}
          </Typography>
        )}

        {dogs.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {dogs.map((dog: Dog) => {
              const { name, _id } = dog;

              return (
                <Chip
                  label={`${name}`}
                  key={_id}
                  color={isMyDog(_id, user!.dogs) ? "success" : "default"}
                  // Stopped from bubbling - a linked task's own click (TaskCell above) opens the lineup, not this.
                  onClick={(event) => {
                    event.stopPropagation();
                    setDogDetailsId(_id);
                  }}
                  sx={{ alignSelf: "flex-start", minHeight: 36, height: "auto" }}
                />
              );
            })}
          </Box>
        )}

        {dogs.length === 0 && <Typography>{t("tasksGrid.noDogsSelected")}</Typography>}
      </TaskCell>

      <DogDetailsModal dogId={dogDetailsId} onClose={() => setDogDetailsId(undefined)} />

      {linked && (
        <TaskLineupModal
          open={isLineupModalOpen}
          onClose={() => setIsLineupModalOpen(false)}
          linked={linked}
        />
      )}
    </>
  );
};

export default DogsTaskCell;
