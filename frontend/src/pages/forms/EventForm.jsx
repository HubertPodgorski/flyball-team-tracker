import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm, useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormDatePicker from "../../components/inputs/FormDatePicker";
import { getEventTypeOptions } from "../../components/inputs/consts";
import FormSelect from "../../components/inputs/FormSelect";
import { CLUBS } from "../../helpers/teams";
import { useCreateEventMutation, useUpdateEventMutation } from "../../queries/events";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";

const teamOptions = CLUBS.map((club) => ({ value: club, label: club }));

// Single source for both useForm's defaultValues and the reset effect below
// - see DogTaskForm.jsx for why keeping these in sync matters.
const mapToFormValues = ({ name, date, type, team }) => ({
  name,
  date,
  type,
  team: team ?? "",
});

const EventForm = ({
  open,
  onClose,
  initialData,
  editingId,
  onSubmitOverride,
}) => {
  const { t } = useTranslation();
  const createEventMutation = useCreateEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const submitGuard = useSubmitGuard();

  const form = useForm({
    defaultValues: mapToFormValues(initialData),
    onSubmit: async ({ value: values }) => {
      // Team reassignment is super-admin only (onSubmitOverride).
      if (onSubmitOverride) {
        await onSubmitOverride(
          {
            name: values.name,
            date: values.date,
            type: values.type,
            team: values.team,
          },
          editingId
        );
        handleClose();
        return;
      }

      const data = {
        name: values.name,
        date: values.date,
        type: values.type,
      };

      if (editingId) {
        updateEventMutation.mutate(
          { ...data, _id: editingId },
          { onSuccess: handleClose }
        );
      } else {
        createEventMutation.mutate(data, { onSuccess: handleClose });
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
      title={editingId ? t("forms.event.editTitle") : t("forms.event.addTitle")}
    >
      <FormGrid>
        <FormSelect
          form={form}
          multi={false}
          name="type"
          options={getEventTypeOptions(t)}
          label={t("forms.event.type")}
        />

        <FormTextField form={form} name="name" label={t("common.name")} required />

        <FormDatePicker form={form} name="date" label={t("common.date")} />

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
              isSubmitting || createEventMutation.isPending || updateEventMutation.isPending
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

export default EventForm;
