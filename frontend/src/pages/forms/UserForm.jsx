import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormSelect from "../../components/inputs/FormSelect";
import { useAppContext } from "../../hooks/useAppContext";
import { useSocketContext } from "../../hooks/useSocketContext";
import { resolveDogsByIds } from "../../helpers/dogs";
import { Roles } from "../../helpers/types";
import { TEAMS } from "../../helpers/teams";

const teamOptions = TEAMS.map((team) => ({ value: team, label: team }));
const roleOptions = Object.values(Roles).map((role) => ({
  value: role,
  label: role,
}));

const UserForm = ({
  open,
  onClose,
  initialData,
  editingId,
  dogsOverride,
  onSubmitOverride,
}) => {
  const { dogs: contextDogs } = useAppContext();
  const { socket } = useSocketContext();
  const dogs = dogsOverride ?? contextDogs;

  const form = useForm({
    defaultValues: initialData,
    onSubmit: async ({ value: values }) => {
      const selectedDogs = resolveDogsByIds(values.dogs, dogs);

      // Team/roles reassignment is super-admin only (onSubmitOverride).
      if (onSubmitOverride) {
        await onSubmitOverride(
          {
            name: values.name,
            dogs: selectedDogs,
            team: values.team,
            roles: values.roles,
          },
          editingId
        );
        handleClose();
        return;
      }

      const data = {
        name: values.name,
        dogs: selectedDogs,
      };

      if (editingId) {
        socket.emit("update_user", { ...data, _id: editingId }, () =>
          handleClose()
        );
      } else {
        socket.emit("add_user", data, () => handleClose());
      }

      // TODO: error handling eventually?
    },
  });

  useEffect(() => {
    const { name, dogs, team, roles } = initialData;

    form.reset({
      name,
      dogs: dogs.map(({ _id }) => _id),
      team: team ?? "",
      roles: roles ?? [],
    });
  }, [initialData, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <FormModal onClose={handleClose} open={open} title="User form">
      <FormGrid>
        <FormTextField form={form} name="name" label="Name" required />

        <FormSelect
          form={form}
          name="dogs"
          label="Dogs"
          options={dogs.map(({ name, _id }) => ({ value: _id, label: name }))}
        />

        {onSubmitOverride && (
          <>
            <FormSelect form={form} name="roles" label="Roles" options={roleOptions} />

            <FormSelect
              form={form}
              name="team"
              label="Team"
              multi={false}
              options={teamOptions}
            />
          </>
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

export default UserForm;
