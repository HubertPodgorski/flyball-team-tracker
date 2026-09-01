import React, { useEffect } from "react";
import { Box, Button, DialogActions } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useForm } from "@tanstack/react-form";
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

const initialData: FormData = { startingPosition: "", time: "", note: "" };

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
  const isEdit = !!crossPass;

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const form = useForm({
    defaultValues: initialData,
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
    form.reset({
      startingPosition: crossPass?.startingPosition ?? "",
      time: crossPass?.time !== undefined ? String(crossPass.time) : "",
      note: crossPass?.note ?? "",
    });
  }, [crossPass, form]);

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {runnerDog.name}
          <ArrowForwardIcon fontSize="inherit" color="disabled" />
          {predecessorDog ? predecessorDog.name : "Lights"}
        </Box>
      }
    >
      <FormGrid>
        <FormStartingPositionField form={form} name="startingPosition" label="Starting position" />

        <FormTextField form={form} name="time" label="Time (s)" type="number" />

        <FormTextField form={form} name="note" label="Note" />

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
              Delete
            </Button>
          )}

          <Button size="medium" variant="outlined" onClick={handleClose}>
            Cancel
          </Button>

          <Button
            size="medium"
            variant="contained"
            onClick={() => form.handleSubmit()}
          >
            Save
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default LineupCrossPassModal;
