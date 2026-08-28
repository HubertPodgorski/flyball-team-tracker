import { Box, Card, IconButton, Typography } from "@mui/material";
import { useAuthContext } from "../../hooks/useAuthContext";
import React, { useState } from "react";
import EditNoteIcon from "@mui/icons-material/EditNote";
import NoteModal from "../../components/modals/NoteModal";
import { Dog } from "../../helpers/types";

const MyDogs = () => {
  const { user } = useAuthContext();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<Dog | undefined>();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {user.dogs.map((dog) => (
        <Card
          sx={{ display: "flex", flexDirection: "column", gap: 1, padding: 1 }}
        >
          <Typography variant="h6">{dog.name}</Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="caption">Notes:</Typography>

              <Typography>{dog.note || "Click button to add notes"}</Typography>
            </Box>

            <IconButton onClick={() => setIsNoteModalOpen(dog)}>
              <EditNoteIcon />
            </IconButton>
          </Box>
        </Card>
      ))}

      <NoteModal
        dog={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(undefined)}
        open={!!isNoteModalOpen}
      />
    </Box>
  );
};

export default MyDogs;
