import React, { useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import TaskCell from "./tasksGrid/TaskCell";
import { useAuthContext } from "../hooks/useAuthContext";
import { isMyDog } from "../helpers/tasks";
import { useIsMobile } from "../hooks/useIsMobile";
import { Dog, Task } from "../helpers/types";
import NoteModal from "./modals/NoteModal";

// TODO: type me
interface Props {
  item: Task;
  index: number;
}

const DogsTaskCell = ({ item: { _id, dogs, description }, index }: Props) => {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<Dog | undefined>();

  const isMobile = useIsMobile();
  const { user } = useAuthContext();

  return (
    <>
      <TaskCell index={index} id={_id} key={_id}>
        <Typography variant={isMobile ? "body2" : "h5"}>
          {description}
        </Typography>

        {dogs.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {dogs.map((dog: Dog) => {
              const { name, _id } = dog;

              return (
                <Chip
                  label={`${name}`}
                  key={_id}
                  color={isMyDog(_id, user!.dogs) ? "success" : "default"}
                  onClick={() => setIsNoteModalOpen(dog)}
                  sx={{ alignSelf: "flex-start" }}
                />
              );
            })}
          </Box>
        )}

        {dogs.length === 0 && <Typography>No dogs selected</Typography>}
      </TaskCell>

      <NoteModal
        dog={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(undefined)}
        open={!!isNoteModalOpen}
      />
    </>
  );
};

export default DogsTaskCell;
