import React, { useEffect, useRef } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm, useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormDatePicker from "../../components/inputs/FormDatePicker";
import { getEventTypeOptions } from "../../components/inputs/consts";
import FormSelect from "../../components/inputs/FormSelect";
import { useClubsQuery } from "../../queries/clubs";
import { useCreateEventMutation, useUpdateEventMutation } from "../../queries/events";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";

// Single source for both useForm's defaultValues and the reset effect below
// - see DogTaskForm.jsx for why keeping these in sync matters.
// date arrives as a plain string when editing (straight from the API) -
// StaticDateTimePicker needs a real Date to render it as selected at all.
const mapToFormValues = ({ name, date, type, team }) => ({
  name,
  date: date ? new Date(date) : date,
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
  const { data: clubs = [] } = useClubsQuery();
  const teamOptions = clubs.map((club) => ({ value: club, label: club }));
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

  const typeOptions = getEventTypeOptions(t);
  const lastAutoNameRef = useRef("");

  // Reapplies initialData/editingId directly - form.reset() alone (see
  // handleClose) can't tell "closed a blank Add" from "cancelled mid-edit",
  // and a plain Add -> Cancel never changes initialData's reference at all,
  // so the effect below wouldn't otherwise re-fire to repair the name.
  const applyInitialValues = () => {
    const values = mapToFormValues(initialData);

    form.reset(values);

    // Auto-fill a fresh, blank session - from `values` (the incoming data),
    // not a useStore read, which would still lag one render behind this reset.
    if (!editingId && !values.name && values.type) {
      const label = typeOptions.find((option) => option.value === values.type)?.label ?? "";

      form.setFieldValue("name", label);
      lastAutoNameRef.current = label;
    }
  };

  useEffect(() => {
    applyInitialValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, editingId, form]);

  const type = useStore(form.store, (state) => state.values.type);
  const name = useStore(form.store, (state) => state.values.name);

  // New events only - reacts to the type dropdown changing mid-session
  // (the effect above handles the initial fill on a freshly-opened one).
  useEffect(() => {
    if (editingId || !type) return;

    if (name !== "" && name !== lastAutoNameRef.current) return;

    const label = typeOptions.find((option) => option.value === type)?.label ?? "";

    form.setFieldValue("name", label);
    lastAutoNameRef.current = label;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleClose = () => {
    applyInitialValues();
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
