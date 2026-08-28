import React, { useEffect } from "react";
import { Dog } from "../../helpers/types";
import { Button, DialogActions } from "@mui/material";
import { useSocketContext } from "../../hooks/useSocketContext";
import { useForm } from "@tanstack/react-form";
import FormModal from "./../FormModal.jsx";
import FormGrid from "./../FormGrid.jsx";
import FormTextField from "./../inputs/FormTextField.jsx";

interface Props {
  open: boolean;
  onClose: () => void;
  dog?: Dog;
}

interface FormData {
  note: string;
}

const NoteModal = ({ dog, open, onClose }: Props) => {
  const { socket } = useSocketContext();

  const form = useForm({
    defaultValues: { note: dog?.note || "" } as FormData,
    onSubmit: async ({ value: { note } }) => {
      if (!dog) return;

      await socket.emit(
        "update_dog",
        { _id: dog._id, note: note || "" },
        () => onClose()
      );

      // TODO: error handling eventually?
    },
  });

  useEffect(() => {
    if (!dog) return;

    form.reset({ note: dog.note || "" });
  }, [dog, form]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`${dog?.name ?? "Dog"}'s notes`}
    >
      <FormGrid>
        <FormTextField form={form} name="note" label="Notes" rows={5} />

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <Button
            size="medium"
            variant="contained"
            onClick={() => form.handleSubmit()}
          >
            Save notes
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default NoteModal;
