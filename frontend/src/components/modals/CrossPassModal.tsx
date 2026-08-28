import React, { useEffect, useMemo } from "react";
import { Button, DialogActions } from "@mui/material";
import { useSocketContext } from "../../hooks/useSocketContext";
import { FormProvider, useForm } from "react-hook-form";
import FormModal from "../FormModal.jsx";
import FormGrid from "../FormGrid.jsx";
import { useAppContext } from "../../hooks/useAppContext";
import { CrossPass, Dog } from "../../helpers/types";
import FormSwitch from "../inputs/FormSwitch";
import FormSelect from "../inputs/FormSelect";
import FormTextSelect from "../inputs/FormTextSelect";

interface FormData {
  runningOnDogId?: string;
  runningOnLights?: boolean;
  note?: string;
  startingPosition?: string;
}

interface Props {
  crossPass?: CrossPass;
  dogId: string;
  onClose: () => void;
  open: boolean;
}

const getSubmitData = (
  { runningOnLights, runningOnDogId, note, startingPosition }: FormData,
  dogs: Dog[],
  dogId: string
) => {
  if (runningOnLights) {
    return {
      runningOnLights,
      note,
      startingPosition,
      runningOnDog: null,
      dogId,
    };
  }

  const dog = dogs.find(({ _id }) => _id === runningOnDogId);

  return {
    runningOnLights,
    note,
    startingPosition,
    runningOnDog: dog,
    dogId,
  };
};

const startingPositionOptions = new Array(20).fill("").map((value, index) => ({
  value: `${index + 1}m`,
  label: `${index + 1}m`,
}));

const initialData = {
  note: "",
  runningOnDogId: "",
  runningOnLights: false,
  startingPosition: "",
};

const CrossPassModal = ({
  crossPass,
  dogId,
  onClose: handleClose,
  open,
}: Props) => {
  const { dogs } = useAppContext();
  const { socket } = useSocketContext();

  const formMethods = useForm<FormData>({
    defaultValues: initialData,
  });

  const { handleSubmit, reset } = useMemo(() => formMethods, [formMethods]);

  useEffect(() => {
    if (!crossPass) return;

    reset({
      note: crossPass?.note || "",
      runningOnDogId: crossPass?.runningOnDog?._id || "",
      runningOnLights: crossPass?.runningOnLights || false,
      startingPosition: crossPass?.startingPosition || "",
    });
  }, [crossPass, reset, dogId]);

  const isEdit = useMemo(() => !!crossPass?._id, [crossPass]);

  const onClose = () => {
    reset(initialData);

    handleClose();
  };

  const onSubmit = (formData: FormData) => {
    if (isEdit) {
      socket.emit(
        "update_cross_pass",
        {
          _id: crossPass._id,
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
  };

  const runningOnLights = formMethods.watch("runningOnLights");

  return (
    <FormProvider {...formMethods}>
      <FormModal
        open={open}
        onClose={onClose}
        title={`${isEdit ? "Edit" : "Create"} cross pass`}
      >
        <FormGrid>
          <FormSwitch name="runningOnLights" label="Running on lights" />

          {!runningOnLights && (
            <FormSelect
              options={dogs.map(({ _id, name }) => ({
                value: _id,
                label: name,
              }))}
              multi={false}
              name="runningOnDogId"
              label="Running on dog"
            />
          )}

          <FormTextSelect
            name="startingPosition"
            label="Starting position"
            options={startingPositionOptions}
          />

          <FormTextSelect name="note" label="Note" options={[]} />

          <DialogActions sx={{ padding: 0 }}>
            <Button size="medium" variant="outlined" onClick={onClose}>
              Cancel
            </Button>

            <Button
              size="medium"
              variant="contained"
              onClick={handleSubmit(onSubmit)}
            >
              Save
            </Button>
          </DialogActions>
        </FormGrid>
      </FormModal>
    </FormProvider>
  );
};

export default CrossPassModal;
