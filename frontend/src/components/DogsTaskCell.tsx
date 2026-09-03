import React, { useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaskCell from "./tasksGrid/TaskCell";
import { useAuthContext } from "../hooks/useAuthContext";
import { isMyDog } from "../helpers/tasks";
import { useIsMobile } from "../hooks/useIsMobile";
import { Dog, Task } from "../helpers/types";
import NoteModal from "./modals/NoteModal";
import { findLinkedLineup } from "../helpers/lineupLink";
import { useTeamsQuery } from "../queries/teams";
import TaskLineupModal from "./teams/TaskLineupModal";

// TODO: type me
interface Props {
  item: Task;
  index: number;
}

const DogsTaskCell = ({ item, index }: Props) => {
  const { _id, dogs, description } = item;
  const { t } = useTranslation();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<Dog | undefined>();
  const [isLineupModalOpen, setIsLineupModalOpen] = useState(false);

  const isMobile = useIsMobile();
  const { user } = useAuthContext();
  const { data: teams = [] } = useTeamsQuery();

  const linked = findLinkedLineup(item, teams);

  const onDogClick = (dog: Dog) => {
    if (linked) {
      setIsLineupModalOpen(true);
      return;
    }

    setIsNoteModalOpen(dog);
  };

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
                  onClick={() => onDogClick(dog)}
                  sx={{ alignSelf: "flex-start" }}
                />
              );
            })}
          </Box>
        )}

        {dogs.length === 0 && <Typography>{t("tasksGrid.noDogsSelected")}</Typography>}
      </TaskCell>

      <NoteModal
        dog={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(undefined)}
        open={!!isNoteModalOpen}
      />

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
