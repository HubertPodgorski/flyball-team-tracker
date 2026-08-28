import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormSelect from "../../components/inputs/FormSelect";
import { useAppContext } from "../../hooks/useAppContext";
import { useSocketContext } from "../../hooks/useSocketContext";

const UserForm = ({ open, onClose, initialData, editingId }) => {
  const { dogs } = useAppContext();
  const { socket } = useSocketContext();

  const form = useForm({
    defaultValues: initialData,
    onSubmit: async ({ value: values }) => {
      // TODO: make helper and reuse it in tasks?
      const selectedDogs = values.dogs
        .map((dogId) => {
          const dog = dogs.find(({ _id }) => _id === dogId);

          if (!dog) return undefined;

          return dog;
        })
        .filter((dog) => !!dog);

      const data = {
        name: values.name,
        dogs: selectedDogs,
      };

      if (editingId) {
        socket.emit("update_user", { ...data, _id: editingId }, () =>
          onClose()
        );
      } else {
        socket.emit("add_user", data, () => onClose());
      }

      // TODO: error handling eventually?
    },
  });

  useEffect(() => {
    const { name, dogs } = initialData;

    form.reset({ name, dogs: dogs.map(({ _id }) => _id) });
  }, [initialData, form]);

  return (
    <FormModal onClose={onClose} open={open} title="User form">
      <FormGrid>
        <FormTextField form={form} name="name" label="Name" required />

        <FormSelect
          form={form}
          name="dogs"
          label="Dogs"
          options={dogs.map(({ name, _id }) => ({ value: _id, label: name }))}
        />

        {/*TODO: select with dogs*/}

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

export default UserForm;
