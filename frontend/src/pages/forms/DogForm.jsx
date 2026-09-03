import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm, useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormSelect from "../../components/inputs/FormSelect";
import { CLUBS } from "../../helpers/teams";
import { useCreateDogMutation, useUpdateDogMutation } from "../../queries/dogs";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";

const teamOptions = CLUBS.map((club) => ({ value: club, label: club }));

// useForm's `defaultValues` and this form's own `form.reset()` calls must
// agree on shape, or TanStack Form's internal update effect fights the
// reset (see UserForm.jsx for the full story) - route both through this.
const mapToFormValues = ({ name, note, team, jumpHeight }) => ({
  name,
  note: note ?? "",
  team: team ?? "",
  jumpHeight: jumpHeight ?? "",
});

const parseJumpHeight = (value) =>
  value === "" || value === undefined ? undefined : Number(value);

const DogForm = ({ open, onClose, initialData, editingId, onSubmitOverride }) => {
  const { t } = useTranslation();
  const createDogMutation = useCreateDogMutation();
  const updateDogMutation = useUpdateDogMutation();
  const submitGuard = useSubmitGuard();

  const form = useForm({
    defaultValues: mapToFormValues(initialData),
    onSubmit: async ({ value: values }) => {
      const jumpHeight = parseJumpHeight(values.jumpHeight);

      // Team/note reassignment is super-admin only (onSubmitOverride).
      if (onSubmitOverride) {
        await onSubmitOverride(
          { name: values.name, note: values.note, team: values.team, jumpHeight },
          editingId
        );
        handleClose();
        return;
      }

      const data = { name: values.name, jumpHeight };

      if (editingId) {
        updateDogMutation.mutate(
          { _id: editingId, ...data },
          { onSuccess: handleClose }
        );
      } else {
        createDogMutation.mutate(data, { onSuccess: handleClose });
      }
    },
  });

  // Fire-and-forget mutations (no optimistic update - see SseHandler.tsx)
  // mean nothing else disables Submit while a request is in flight - a fast
  // double-click fired two creates before the first ever resolved. isPending
  // covers the local mutate() branches; isSubmitting covers onSubmitOverride
  // (that branch is properly awaited, so the form's own submission state
  // stays true for its whole duration too).
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
      title={editingId ? t("forms.dog.editTitle") : t("forms.dog.addTitle")}
    >
      <FormGrid>
        <FormTextField form={form} name="name" label={t("common.name")} required />

        <FormTextField
          form={form}
          name="jumpHeight"
          label={t("forms.dog.jumpHeight")}
          type="number"
        />

        {onSubmitOverride && (
          <>
            <FormTextField form={form} name="note" label={t("common.note")} />

            <FormSelect
              form={form}
              name="team"
              label={t("common.team")}
              multi={false}
              options={teamOptions}
            />
          </>
        )}

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={handleClose}>
            {t("common.cancel")}
          </Button>

          <Button
            size="medium"
            variant="contained"
            disabled={
              isSubmitting || createDogMutation.isPending || updateDogMutation.isPending
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

export default DogForm;
