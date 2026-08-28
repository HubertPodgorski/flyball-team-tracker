import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import { useSocketContext } from "../../hooks/useSocketContext";

const DogTaskForm = ({ open, onClose, initialData, editingId }) => {
  const { socket } = useSocketContext();

  const form = useForm({
    defaultValues: initialData,
    onSubmit: async ({ value: { name } }) => {
      const data = { name };

      if (editingId) {
        await socket.emit(
          "update_dog_task",
          { _id: editingId, ...data },
          () => onClose()
        );
      } else {
        await socket.emit("add_dog_task", data, () => onClose());
      }

      // TODO: error handling eventually?
    },
  });

  useEffect(() => {
    const { name } = initialData;

    form.reset({ name });
  }, [initialData, form]);

  return (
    <FormModal onClose={onClose} open={open} title="Dog task form">
      <FormGrid>
        <FormTextField form={form} name="name" label="Task name" required />

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <Button
            size="medium"
            variant="contained"
            onClick={() => form.handleSubmit()}
          >
            Submit
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default DogTaskForm;
