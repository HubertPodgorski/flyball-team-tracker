import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormDatePicker from "../../components/inputs/FormDatePicker";
import { eventTypeOptions } from "../../components/inputs/consts";
import FormSelect from "../../components/inputs/FormSelect";
import { useSocketContext } from "../../hooks/useSocketContext";

const EventForm = ({
  open,
  onClose,
  initialData,
  editingId,
  onSubmitOverride,
}) => {
  const { socket } = useSocketContext();

  const form = useForm({
    defaultValues: initialData,
    onSubmit: async ({ value: values }) => {
      const data = {
        name: values.name,
        date: values.date,
        type: values.type,
      };

      if (onSubmitOverride) {
        await onSubmitOverride(data, editingId);
        onClose();
        return;
      }

      if (editingId) {
        socket.emit("update_event", { ...data, _id: editingId }, () => {
          onClose();
        });
      } else {
        socket.emit("add_event", data, () => {
          onClose();
        });
      }

      // TODO: error handling eventually?
    },
  });

  useEffect(() => {
    const { name, date, type } = initialData;

    form.reset({ name, date, type });
  }, [initialData, form]);

  return (
    <FormModal onClose={onClose} open={open} title="Event">
      <FormGrid>
        <FormSelect
          form={form}
          multi={false}
          name="type"
          options={eventTypeOptions}
          label="Event type"
        />

        <FormTextField form={form} name="name" label="Name" required />

        <FormDatePicker form={form} name="date" label="Date" />

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

export default EventForm;
