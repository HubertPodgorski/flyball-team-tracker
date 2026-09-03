import React, { useState } from "react";
import {
  Button,
  Checkbox,
  DialogActions,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import FormModal from "../FormModal";
import FormGrid from "../FormGrid";
import { Dog } from "../../helpers/types";
import { resolveDogsByIds } from "../../helpers/dogs";
import { LINEUP_MAX_DOGS, LINEUP_MIN_DOGS } from "../../helpers/lineup";
import ClearableTextField from "../inputs/ClearableTextField";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";

interface Props {
  open: boolean;
  onClose: () => void;
  dogs: Dog[];
  onCreate: (lineup: { name?: string; dogs: Dog[] }) => void;
  // The underlying mutation is fire-and-forget (see TeamCard.tsx) - this
  // form closes itself right after calling onCreate rather than waiting on
  // it, so a fast double-click needs the caller's own pending state to guard
  // against firing twice.
  isSubmitting?: boolean;
}

const AddLineupModal = ({ open, onClose, dogs, onCreate, isSubmitting }: Props) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const submitGuard = useSubmitGuard();

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
    <FormModal open={open} onClose={handleClose} title={t("pages.teams.newLineup")}>
      <FormGrid>
        <ClearableTextField
          label={t("pages.teams.lineupNameOptional")}
          value={name}
          onChange={setName}
        />

        <Typography variant="body2" color="text.secondary">
          {t("pages.teams.pickDogsRange", {
            min: LINEUP_MIN_DOGS,
            max: LINEUP_MAX_DOGS,
            count: selectedIds.length,
          })}
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
            {t("common.cancel")}
          </Button>

          <Button
            size="medium"
            variant="contained"
            disabled={
              isSubmitting ||
              selectedIds.length < LINEUP_MIN_DOGS ||
              selectedIds.length > LINEUP_MAX_DOGS
            }
            onClick={() => submitGuard(onSubmit)}
          >
            {t("common.create")}
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default AddLineupModal;
