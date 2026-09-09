import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Dog } from "../../helpers/types";

export const MAX_TEAM_DOGS = 6;

interface Props {
  dogs: Dog[];
  allDogs: Dog[];
  editable: boolean;
  onChange: (dogs: Dog[]) => void;
}

// A team's own roster is just a pool, not an ordered lineup - a plain multiselect of chips is all it needs.
const TeamDogsEditor = ({ dogs, allDogs, editable, onChange }: Props) => {
  const { t } = useTranslation();

  if (!editable) {
    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {dogs.map((dog) => (
          <Chip key={dog._id} label={dog.name} />
        ))}

        {dogs.length === 0 && (
          <Typography color="text.secondary">{t("pages.teams.noDogsYet")}</Typography>
        )}
      </Box>
    );
  }

  const toggleDog = (dog: Dog) => {
    const isSelected = dogs.some(({ _id }) => _id === dog._id);

    if (isSelected) {
      onChange(dogs.filter(({ _id }) => _id !== dog._id));
      return;
    }

    if (dogs.length >= MAX_TEAM_DOGS) return;

    onChange([...dogs, dog]);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {allDogs.map((dog) => {
          const isSelected = dogs.some(({ _id }) => _id === dog._id);
          const disabled = !isSelected && dogs.length >= MAX_TEAM_DOGS;

          return (
            <Chip
              key={dog._id}
              label={dog.name}
              color={isSelected ? "primary" : "default"}
              variant={isSelected ? "filled" : "outlined"}
              disabled={disabled}
              onClick={() => toggleDog(dog)}
            />
          );
        })}
      </Box>

      {dogs.length >= MAX_TEAM_DOGS && (
        <Typography variant="caption" color="text.secondary">
          {t("pages.teams.teamFull", { max: MAX_TEAM_DOGS })}
        </Typography>
      )}
    </Box>
  );
};

export default TeamDogsEditor;
