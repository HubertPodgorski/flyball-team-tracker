import React, { useEffect } from "react";
import { Box, Button, DialogActions, Typography, styled } from "@mui/material";
import { ReactSortable, type ItemInterface } from "react-sortablejs";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormSelect from "../../components/inputs/FormSelect";
import type { AnyReactFormApi } from "../../components/inputs/utils";
import { useAppContext } from "../../hooks/useAppContext";
import { CreateEditTaskFormType, CreateEditTaskRequestType } from "./types";
import { Position, Task } from "../../helpers/types";
import FormTextSelect from "../../components/inputs/FormTextSelect";
import { useSocketContext } from "../../hooks/useSocketContext";
import { useDogsWithAttendance } from "../../hooks/useDogsWithAttendance";
import { useTaskPlanningContext } from "../../hooks/useTaskPlanningContext";
import { getDogPlanningColor } from "../../helpers/calendar";
import { resolveDogsByIds } from "../../helpers/dogs";

interface DogOrderItem extends ItemInterface {
  name: string;
}

const DogOrderRowStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.secondary.main}`,
  borderRadius: "6px",
  cursor: "grab",
}));

// Reorders the same `dogs` field FormSelect writes to - doesn't pick dogs.
const DogsOrderField = ({ form }: { form: AnyReactFormApi }) => {
  const { dogs } = useAppContext();

  return (
    <form.Field name="dogs">
      {(field: AnyFieldApi) => {
        const selectedIds: string[] = field.state.value ?? [];

        if (selectedIds.length < 2) return null;

        const items: DogOrderItem[] = selectedIds
          .map((id) => dogs.find((dog) => dog._id === id))
          .filter((dog): dog is (typeof dogs)[number] => !!dog)
          .map((dog) => ({ id: dog._id, name: dog.name }));

        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Set dogs order
            </Typography>

            <ReactSortable
              list={items}
              setList={(newItems: DogOrderItem[]) =>
                field.handleChange(newItems.map((item) => item.id))
              }
              animation={150}
              forceFallback
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {items.map((item) => (
                <DogOrderRowStyled key={item.id}>
                  <OpenWithIcon fontSize="small" />
                  <Typography>{item.name}</Typography>
                </DogOrderRowStyled>
              ))}
            </ReactSortable>
          </Box>
        );
      }}
    </form.Field>
  );
};

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
  const { selectedEventId } = useTaskPlanningContext();
  const dogsWithAttendance = useDogsWithAttendance(selectedEventId);

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
      const selectedDogs = resolveDogsByIds(values.dogs, dogs);

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

  const dogOptions = dogs.map(({ name, _id }) => {
    const attendance = dogsWithAttendance.find(({ _id: dogId }) => dogId === _id);
    const color = attendance
      ? getDogPlanningColor(attendance.isPlanned, attendance.status)
      : null;

    return { value: _id, label: name, color: color ?? undefined };
  });

  return (
    <FormModal onClose={onClose} open={open} title="Task">
      <FormGrid>
        <FormTextSelect
          form={form}
          label="Type or select task description"
          options={dogTaskOptions}
          name="description"
        />

        <FormSelect form={form} name="dogs" label="Dogs" options={dogOptions} />

        <DogsOrderField form={form} />

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
