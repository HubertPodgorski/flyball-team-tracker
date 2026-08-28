import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormSelect from "../../components/inputs/FormSelect";
import { useAppContext } from "../../hooks/useAppContext";
import { CreateEditTaskFormType, CreateEditTaskRequestType } from "./types";
import { Position, Task } from "../../helpers/types";
import FormTextSelect from "../../components/inputs/FormTextSelect";
import { useSocketContext } from "../../hooks/useSocketContext";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData: Task;
  editingId?: string;
  maxRowIndex?: number;
}

const mapToFormType = ({
  description,
  dogs,
  position,
}: Task): CreateEditTaskFormType => ({
  description,
  dogs: dogs.map(({ _id }) => _id),
  position,
});

const TaskForm = ({
  open,
  onClose,
  initialData,
  editingId,
  maxRowIndex,
}: Props) => {
  const { dogs, dogTasks } = useAppContext();
  const { socket } = useSocketContext();

  const getPosition = (values: CreateEditTaskFormType): Position => {
    if (editingId) {
      return {
        ...values.position,
        rowIndex: values.position.rowIndex,
      };
    }

    if (maxRowIndex) {
      return {
        ...values.position,
        rowIndex: maxRowIndex,
      };
    }

    return values.position;
  };

  const form = useForm({
    defaultValues: mapToFormType(initialData),
    onSubmit: async ({ value: values }) => {
      // TODO: map selected dogs to dogs
      // TODO: extract me to external method - used twice already
      const selectedDogs = values.dogs
        .map((dogId) => {
          const dog = dogs.find(({ _id }) => _id === dogId);

          if (!dog) return undefined;

          return dog;
        })
        .filter((dog) => !!dog);

      const data: CreateEditTaskRequestType = {
        description: values.description,
        dogs: selectedDogs,
        position: getPosition(values),
      };

      if (editingId) {
        socket.emit("update_task", { ...data, _id: editingId }, () => {
          onClose();
        });
      } else {
        socket.emit("add_task", data, () => {
          onClose();
        });
      }

      // TODO: error handling eventually?
    },
  });

  useEffect(() => {
    form.reset(mapToFormType(initialData));
  }, [initialData, form]);

  const dogTaskOptions = dogTasks.map(({ name }) => ({
    value: name,
    label: name,
  }));

  return (
    <FormModal onClose={onClose} open={open} title="Task">
      <FormGrid>
        <FormTextSelect
          form={form}
          label="Type or select task description"
          options={dogTaskOptions}
          name="description"
        />

        <FormSelect
          form={form}
          name="dogs"
          label="Dogs"
          options={dogs.map(({ name, _id }) => ({ value: _id, label: name }))}
        />

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

export default TaskForm;
