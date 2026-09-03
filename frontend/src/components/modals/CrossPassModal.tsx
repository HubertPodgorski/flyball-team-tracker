import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import {
  useCreateCrossPassMutation,
  useUpdateCrossPassMutation,
} from "../../queries/crossPasses";
import { useForm, useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import FormModal from "../FormModal.jsx";
import FormGrid from "../FormGrid.jsx";
import { useDogsQuery } from "../../queries/dogs";
import { CrossPass, Dog } from "../../helpers/types";
import FormSwitch from "../inputs/FormSwitch";
import FormSelect from "../inputs/FormSelect";
import FormTextSelect from "../inputs/FormTextSelect";
import FormTextField from "../inputs/FormTextField";
import FormStartingPositionField from "../inputs/FormStartingPositionField";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";

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

// Single source for both useForm's defaultValues and the reset effect below
// - a frozen empty defaultValues constant used to disagree with the real
// reset target, and TanStack Form's own internal resync-to-defaultValues
// effect fought it, most visibly for runningOnLights (its mount/unmount of
// the "running on dog" field was enough to trigger the resync and blank the
// whole form on edit). Keeping both derived from the same function closes
// the gap.
const getFormValues = (crossPass?: CrossPass): FormData => ({
  note: crossPass?.note || "",
  runningOnDogId: crossPass?.runningOnDog?._id || "",
  runningOnLights: crossPass?.runningOnLights || false,
  startingPosition: crossPass?.startingPosition || "",
  time: crossPass?.time !== undefined ? String(crossPass.time) : "",
});

const CrossPassModal = ({
  crossPass,
  dogId,
  onClose: handleClose,
  open,
}: Props) => {
  const { t } = useTranslation();
  const { data: dogs = [] } = useDogsQuery();
  const createCrossPassMutation = useCreateCrossPassMutation();
  const updateCrossPassMutation = useUpdateCrossPassMutation();
  const submitGuard = useSubmitGuard();

  const isEdit = !!crossPass?._id;

  const onClose = () => {
    form.reset(getFormValues(undefined));

    handleClose();
  };

  const form = useForm({
    defaultValues: getFormValues(crossPass),
    onSubmit: ({ value: formData }) => {
      if (isEdit) {
        updateCrossPassMutation.mutate(
          {
            _id: crossPass!._id,
            ...getSubmitData(formData, dogs, dogId),
          },
          { onSuccess: onClose }
        );
      } else {
        createCrossPassMutation.mutate(getSubmitData(formData, dogs, dogId), {
          onSuccess: onClose,
        });
      }
    },
  });

  useEffect(() => {
    if (!crossPass) return;

    form.reset(getFormValues(crossPass));
  }, [crossPass, form, dogId]);

  const runningOnLights = useStore(
    form.store,
    (state) => state.values.runningOnLights
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEdit ? t("modals.crossPass.edit") : t("modals.crossPass.create")}
    >
      <FormGrid>
        <FormSwitch
          form={form}
          name="runningOnLights"
          label={t("modals.crossPass.runningOnLights")}
        />

        {!runningOnLights && (
          <FormSelect
            form={form}
            options={dogs.map(({ _id, name }) => ({
              value: _id,
              label: name,
            }))}
            multi={false}
            name="runningOnDogId"
            label={t("modals.crossPass.runningOnDog")}
          />
        )}

        <FormStartingPositionField
          form={form}
          name="startingPosition"
          label={t("modals.crossPass.startingPosition")}
        />

        <FormTextField
          form={form}
          name="time"
          label={t("modals.crossPass.time")}
          type="number"
        />

        <FormTextSelect form={form} name="note" label={t("common.note")} options={[]} />

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={onClose}>
            {t("common.cancel")}
          </Button>

          <Button
            size="medium"
            variant="contained"
            disabled={createCrossPassMutation.isPending || updateCrossPassMutation.isPending}
            onClick={() => submitGuard(() => form.handleSubmit())}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default CrossPassModal;
