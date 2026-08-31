import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormSelect from "../../components/inputs/FormSelect";
import { TEAMS } from "../../helpers/teams";
import { useSocketContext } from "../../hooks/useSocketContext";

const teamOptions = TEAMS.map((team) => ({ value: team, label: team }));

const DogTaskForm = ({
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
          { name: values.name, team: values.team },
          editingId
        );
        handleClose();
        return;
      }

      const data = { name: values.name };

      if (editingId) {
        await socket.emit(
          "update_dog_task",
          { _id: editingId, ...data },
          () => handleClose()
        );
      } else {
        await socket.emit("add_dog_task", data, () => handleClose());
      }

      // TODO: error handling eventually?
    },
  });

  useEffect(() => {
    const { name, team } = initialData;

    form.reset({ name, team: team ?? "" });
  }, [initialData, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <FormModal onClose={handleClose} open={open} title="Dog task form">
      <FormGrid>
        <FormTextField form={form} name="name" label="Task name" required />

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

export default DogTaskForm;
