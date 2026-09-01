import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useSocketContext } from "../../hooks/useSocketContext";
import { useForm, useStore } from "@tanstack/react-form";
import FormModal from "../FormModal.jsx";
import FormGrid from "../FormGrid.jsx";
import { useAppContext } from "../../hooks/useAppContext";
import { CrossPass, Dog } from "../../helpers/types";
import FormSwitch from "../inputs/FormSwitch";
import FormSelect from "../inputs/FormSelect";
import FormTextSelect from "../inputs/FormTextSelect";
import FormTextField from "../inputs/FormTextField";
import FormStartingPositionField from "../inputs/FormStartingPositionField";

interface FormData {
  runningOnDogId?: string;
  runningOnLights?: boolean;
  note?: string;
  startingPosition?: string;
  time?: string;
}

interface Props {
  crossPass?: CrossPass;
  dogId: string | undefined;
  onClose: () => void;
  open: boolean;
}

const getSubmitData = (
  { runningOnLights, runningOnDogId, note, startingPosition, time }: FormData,
  dogs: Dog[],
  dogId: string | undefined
) => {
  const time_ = time ? Number(time) : undefined;

  if (runningOnLights) {
    return {
      runningOnLights,
      note,
      startingPosition,
      time: time_,
      runningOnDog: null,
      dogId,
    };
  }

  const dog = dogs.find(({ _id }) => _id === runningOnDogId);

  return {
    runningOnLights,
    note,
    startingPosition,
    time: time_,
    runningOnDog: dog,
    dogId,
  };
};

const initialData: FormData = {
  note: "",
  runningOnDogId: "",
  runningOnLights: false,
  startingPosition: "",
  time: "",
};

const CrossPassModal = ({
  crossPass,
  dogId,
  onClose: handleClose,
  open,
}: Props) => {
  const { dogs } = useAppContext();
  const { socket } = useSocketContext();

  const isEdit = !!crossPass?._id;

  const onClose = () => {
    form.reset(initialData);

    handleClose();
  };

  const form = useForm({
    defaultValues: initialData,
    onSubmit: ({ value: formData }) => {
      if (isEdit) {
        socket.emit(
          "update_cross_pass",
          {
            _id: crossPass!._id,
            ...getSubmitData(formData, dogs, dogId),
          },
          () => onClose()
        );
      } else {
        socket.emit(
          "create_cross_pass",
          getSubmitData(formData, dogs, dogId),
          () => onClose()
        );
      }
    },
  });

  useEffect(() => {
    if (!crossPass) return;

    form.reset({
      note: crossPass?.note || "",
      runningOnDogId: crossPass?.runningOnDog?._id || "",
      runningOnLights: crossPass?.runningOnLights || false,
      startingPosition: crossPass?.startingPosition || "",
      time: crossPass?.time !== undefined ? String(crossPass.time) : "",
    });
  }, [crossPass, form, dogId]);

  const runningOnLights = useStore(
    form.store,
    (state) => state.values.runningOnLights
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`${isEdit ? "Edit" : "Create"} cross pass`}
    >
      <FormGrid>
        <FormSwitch form={form} name="runningOnLights" label="Running on lights" />

        {!runningOnLights && (
          <FormSelect
            form={form}
            options={dogs.map(({ _id, name }) => ({
              value: _id,
              label: name,
            }))}
            multi={false}
            name="runningOnDogId"
            label="Running on dog"
          />
        )}

        <FormStartingPositionField form={form} name="startingPosition" label="Starting position" />

        <FormTextField form={form} name="time" label="Time (s)" type="number" />

        <FormTextSelect form={form} name="note" label="Note" options={[]} />

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <Button
            size="medium"
            variant="contained"
            onClick={() => form.handleSubmit()}
          >
            Save
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default CrossPassModal;
