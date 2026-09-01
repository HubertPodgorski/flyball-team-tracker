import React, { useEffect, useState } from "react";
import { ReactSortable, type ItemInterface } from "react-sortablejs";
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  styled,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import { Dog } from "../../helpers/types";

export const MAX_TEAM_DOGS = 6;

const DogRowStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.secondary.main}`,
  borderRadius: "6px",
  cursor: "grab",
}));

const toItems = (dogs: Dog[]): ItemInterface[] => dogs.map(({ _id }) => ({ id: _id }));

interface Props {
  dogs: Dog[];
  allDogs: Dog[];
  editable: boolean;
  onChange: (dogs: Dog[]) => void;
}

const TeamDogsEditor = ({ dogs, allDogs, editable, onChange }: Props) => {
  const [items, setItems] = useState<ItemInterface[]>(() => toItems(dogs));

  useEffect(() => {
    setItems(toItems(dogs));
  }, [dogs]);

  if (!editable) {
    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {dogs.map((dog, index) => (
          <Chip key={dog._id} label={`${index + 1}. ${dog.name}`} />
        ))}

        {dogs.length === 0 && (
          <Typography color="text.secondary">No dogs yet</Typography>
        )}
      </Box>
    );
  }

  const availableDogs = allDogs.filter(
    (dog) => !dogs.some(({ _id }) => _id === dog._id)
  );

  const onAddDog = (dogId: string) => {
    const dog = allDogs.find(({ _id }) => _id === dogId);

    if (!dog) return;

    onChange([...dogs, dog]);
  };

  const onRemoveDog = (dogId: string) => {
    onChange(dogs.filter(({ _id }) => _id !== dogId));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <ReactSortable
        list={items}
        setList={(newItems) => {
          setItems(newItems);

          const reordered = newItems
            .map(({ id }) => dogs.find(({ _id }) => _id === id))
            .filter((dog): dog is Dog => !!dog);

          onChange(reordered);
        }}
        animation={150}
        forceFallback
        style={{ display: "flex", flexDirection: "column", gap: "4px" }}
      >
        {items.map((item, index) => {
          const dog = dogs.find(({ _id }) => _id === item.id);

          if (!dog) return null;

          return (
            <DogRowStyled key={dog._id}>
              <OpenWithIcon fontSize="small" />

              <Typography sx={{ flexGrow: 1 }}>
                {index + 1}. {dog.name}
              </Typography>

              <IconButton size="small" onClick={() => onRemoveDog(dog._id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </DogRowStyled>
          );
        })}
      </ReactSortable>

      {dogs.length < MAX_TEAM_DOGS && availableDogs.length > 0 && (
        <FormControl size="small">
          <InputLabel id="add-team-dog-label">Add dog</InputLabel>
          <Select
            labelId="add-team-dog-label"
            label="Add dog"
            value=""
            onChange={(event) => onAddDog(event.target.value)}
          >
            {availableDogs.map((dog) => (
              <MenuItem key={dog._id} value={dog._id}>
                {dog.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {dogs.length >= MAX_TEAM_DOGS && (
        <Typography variant="caption" color="text.secondary">
          Team is full ({MAX_TEAM_DOGS} dogs max)
        </Typography>
      )}
    </Box>
  );
};

export default TeamDogsEditor;
