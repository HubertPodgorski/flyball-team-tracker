import React, { useEffect } from "react";
import { Box, Button, DialogActions } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import FormModal from "../FormModal";
import FormGrid from "../FormGrid";
import FormTextField from "../inputs/FormTextField";
import FormStartingPositionField from "../inputs/FormStartingPositionField";
import { Dog, LineupCrossPass } from "../../helpers/types";

interface FormData {
  startingPosition: string;
  time: string;
  note: string;
}

// Same shape for both defaultValues and the reset effect below - see
// CrossPassModal.tsx's getFormValues for why keeping these in sync matters.
const getFormValues = (crossPass?: LineupCrossPass): FormData => ({
  startingPosition: crossPass?.startingPosition ?? "",
  time: crossPass?.time !== undefined ? String(crossPass.time) : "",
  note: crossPass?.note ?? "",
});

export interface LineupCrossPassSaveData {
  startingPosition: string;
  time?: number;
  note: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  crossPass?: LineupCrossPass;
  runnerDog: Dog;
  predecessorDog?: Dog;
  onSave: (data: LineupCrossPassSaveData) => void;
  onDelete: () => void;
}

const LineupCrossPassModal = ({
  open,
  onClose,
  crossPass,
  runnerDog,
  predecessorDog,
  onSave,
  onDelete,
}: Props) => {
  const { t } = useTranslation();
  const isEdit = !!crossPass;

  const handleClose = () => {
    form.reset(getFormValues(undefined));
    onClose();
  };

  const form = useForm({
    defaultValues: getFormValues(crossPass),
    onSubmit: ({ value }) => {
      onSave({
        startingPosition: value.startingPosition,
        time: value.time ? Number(value.time) : undefined,
        note: value.note,
      });
      handleClose();
    },
  });

  useEffect(() => {
    form.reset(getFormValues(crossPass));
  }, [crossPass, form]);

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {runnerDog.name}
          <ArrowForwardIcon fontSize="inherit" color="disabled" />
          {predecessorDog ? predecessorDog.name : t("pages.teams.lights")}
        </Box>
      }
    >
      <FormGrid>
        <FormStartingPositionField
          form={form}
          name="startingPosition"
          label={t("modals.crossPass.startingPosition")}
        />

        <FormTextField form={form} name="time" label={t("modals.crossPass.time")} type="number" />

        <FormTextField form={form} name="note" label={t("common.note")} />

        <DialogActions sx={{ padding: 0 }}>
          {isEdit && (
            <Button
              size="medium"
              color="error"
              onClick={() => {
                onDelete();
                handleClose();
              }}
              sx={{ marginRight: "auto" }}
            >
              {t("common.delete")}
            </Button>
          )}

          <Button size="medium" variant="outlined" onClick={handleClose}>
            {t("common.cancel")}
          </Button>

          <Button
            size="medium"
            variant="contained"
            onClick={() => form.handleSubmit()}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default LineupCrossPassModal;
