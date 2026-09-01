import React, { useState } from "react";
import {
  Button,
  Checkbox,
  DialogActions,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import FormModal from "../FormModal";
import FormGrid from "../FormGrid";
import { Dog } from "../../helpers/types";
import { resolveDogsByIds } from "../../helpers/dogs";
import { LINEUP_MAX_DOGS, LINEUP_MIN_DOGS } from "../../helpers/lineup";
import ClearableTextField from "../inputs/ClearableTextField";

interface Props {
  open: boolean;
  onClose: () => void;
  dogs: Dog[];
  onCreate: (lineup: { name?: string; dogs: Dog[] }) => void;
}

const AddLineupModal = ({ open, onClose, dogs, onCreate }: Props) => {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleClose = () => {
    setName("");
    setSelectedIds([]);
    onClose();
  };

  const toggleDog = (dogId: string) => {
    setSelectedIds((previous) => {
      if (previous.includes(dogId)) {
        return previous.filter((id) => id !== dogId);
      }

      if (previous.length >= LINEUP_MAX_DOGS) return previous;

      return [...previous, dogId];
    });
  };

  const onSubmit = () => {
    onCreate({
      name: name.trim() || undefined,
      dogs: resolveDogsByIds(selectedIds, dogs),
    });
    handleClose();
  };

  return (
    <FormModal open={open} onClose={handleClose} title="New lineup">
      <FormGrid>
        <ClearableTextField
          label="Lineup name (optional)"
          value={name}
          onChange={setName}
        />

        <Typography variant="body2" color="text.secondary">
          Pick {LINEUP_MIN_DOGS}-{LINEUP_MAX_DOGS} dogs ({selectedIds.length}/{LINEUP_MAX_DOGS})
        </Typography>

        <FormGroup>
          {dogs.map((dog) => (
            <FormControlLabel
              key={dog._id}
              control={
                <Checkbox
                  checked={selectedIds.includes(dog._id)}
                  onChange={() => toggleDog(dog._id)}
                  disabled={
                    !selectedIds.includes(dog._id) &&
                    selectedIds.length >= LINEUP_MAX_DOGS
                  }
                />
              }
              label={dog.name}
            />
          ))}
        </FormGroup>

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={handleClose}>
            Cancel
          </Button>

          <Button
            size="medium"
            variant="contained"
            disabled={
              selectedIds.length < LINEUP_MIN_DOGS ||
              selectedIds.length > LINEUP_MAX_DOGS
            }
            onClick={onSubmit}
          >
            Create
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default AddLineupModal;
