import React, { useEffect, useMemo } from "react";
import { Button, DialogActions } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
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

  const formMethods = useForm<CreateEditTaskFormType>({
    defaultValues: mapToFormType(initialData),
  });

  const { handleSubmit, reset } = useMemo(() => formMethods, [formMethods]);

  useEffect(() => {
    reset(mapToFormType(initialData));
  }, [initialData, reset]);

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

  const onSubmit = async (values: CreateEditTaskFormType) => {
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
  };

  const dogTaskOptions = useMemo(
    () => dogTasks.map(({ name }) => ({ value: name, label: name })),
    [dogTasks]
  );

  return (
    <FormProvider {...formMethods}>
      <FormModal onClose={onClose} open={open} title="Task">
        <FormGrid>
          <FormTextSelect
            label="Type or select task description"
            options={dogTaskOptions}
            name="description"
          />

          <FormSelect
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
              onClick={handleSubmit(onSubmit)}
            >
              Submit
            </Button>
          </DialogActions>
        </FormGrid>
      </FormModal>
    </FormProvider>
  );
};

export default TaskForm;
