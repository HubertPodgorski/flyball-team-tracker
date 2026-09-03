import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm, useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormSelect from "../../components/inputs/FormSelect";
import { CLUBS } from "../../helpers/teams";
import {
  useCreateDogTaskMutation,
  useUpdateDogTaskMutation,
} from "../../queries/dogTasks";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";

const teamOptions = CLUBS.map((club) => ({ value: club, label: club }));

// Single source for both defaultValues and the reset effect below - see
// CrossPassModal.tsx's getFormValues for why keeping these in sync matters.
// Not visibly broken here (team's field isn't gated on a live form value),
// but the same latent risk, so worth closing anyway.
const mapToFormValues = ({ name, team }) => ({ name, team: team ?? "" });

const DogTaskForm = ({
  open,
  onClose,
  initialData,
  editingId,
  onSubmitOverride,
}) => {
  const { t } = useTranslation();
  const createDogTaskMutation = useCreateDogTaskMutation();
  const updateDogTaskMutation = useUpdateDogTaskMutation();
  const submitGuard = useSubmitGuard();

  const form = useForm({
    defaultValues: mapToFormValues(initialData),
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
        updateDogTaskMutation.mutate(
          { _id: editingId, ...data },
          { onSuccess: handleClose }
        );
      } else {
        createDogTaskMutation.mutate(data, { onSuccess: handleClose });
      }
    },
  });

  // See DogForm.jsx for why both flags are needed.
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  useEffect(() => {
    form.reset(mapToFormValues(initialData));
  }, [initialData, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <FormModal
      onClose={handleClose}
      open={open}
      title={editingId ? t("forms.dogTask.editTitle") : t("forms.dogTask.addTitle")}
    >
      <FormGrid>
        <FormTextField
          form={form}
          name="name"
          label={t("forms.dogTask.name")}
          required
        />

        {onSubmitOverride && (
          <FormSelect
            form={form}
            name="team"
            label={t("common.team")}
            multi={false}
            options={teamOptions}
          />
        )}

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={handleClose}>
            {t("common.cancel")}
          </Button>

          <Button
            size="medium"
            variant="contained"
            disabled={
              isSubmitting ||
              createDogTaskMutation.isPending ||
              updateDogTaskMutation.isPending
            }
            onClick={() => submitGuard(() => form.handleSubmit())}
          >
            {t("common.submit")}
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default DogTaskForm;
