import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormDatePicker from "../../components/inputs/FormDatePicker";
import { eventTypeOptions } from "../../components/inputs/consts";
import FormSelect from "../../components/inputs/FormSelect";
import { TEAMS } from "../../helpers/teams";
import { useSocketContext } from "../../hooks/useSocketContext";

const teamOptions = TEAMS.map((team) => ({ value: team, label: team }));

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
      // Team reassignment is super-admin only (onSubmitOverride).
      if (onSubmitOverride) {
        await onSubmitOverride(
          {
            name: values.name,
            date: values.date,
            type: values.type,
            team: values.team,
          },
          editingId
        );
        handleClose();
        return;
      }

      const data = {
        name: values.name,
        date: values.date,
        type: values.type,
      };

      if (editingId) {
        socket.emit("update_event", { ...data, _id: editingId }, () => {
          handleClose();
        });
      } else {
        socket.emit("add_event", data, () => {
          handleClose();
        });
      }

      // TODO: error handling eventually?
    },
  });

  useEffect(() => {
    const { name, date, type, team } = initialData;

    form.reset({ name, date, type, team: team ?? "" });
  }, [initialData, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <FormModal onClose={handleClose} open={open} title="Event">
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

        {onSubmitOverride && (
          <FormSelect
            form={form}
            name="team"
            label="Team"
            multi={false}
            options={teamOptions}
          />
        )}

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={handleClose}>
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
