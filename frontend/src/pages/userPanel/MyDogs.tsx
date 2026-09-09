import { Box, Card } from "@mui/material";
import React from "react";
import DogDetailsCard from "../../components/DogDetailsCard";
import SuperAdminDogPicker from "../../components/SuperAdminDogPicker";
import { useDogsToShow } from "../../hooks/useDogsToShow";

const MyDogs = () => {
  const { allDogs, dogsToShow, isSuperAdmin, pickedDogs, setPickedDogIds } = useDogsToShow();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {isSuperAdmin && <SuperAdminDogPicker allDogs={allDogs} pickedDogs={pickedDogs} onChange={setPickedDogIds} />}

      {dogsToShow.map((dog) => (
        // overflow: visible - Card defaults to hidden, which clipped the notes field's floating label.
        <Card
          key={dog._id}
          sx={{ display: "flex", flexDirection: "column", gap: 2, padding: 1, overflow: "visible" }}
        >
          <DogDetailsCard dog={dog} canEdit />
        </Card>
      ))}
    </Box>
  );
};

export default MyDogs;
