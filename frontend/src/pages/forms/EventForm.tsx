import React, { useEffect, useRef } from "react";
import { Button, Chip, DialogActions, Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useForm, useStore } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import FormTextField from "../../components/inputs/FormTextField";
import FormSwitch from "../../components/inputs/FormSwitch";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormDatePicker from "../../components/inputs/FormDatePicker";
import { EventType, getEventTypeOptions, getWeekdayOptions } from "../../components/inputs/consts";
import FormSelect from "../../components/inputs/FormSelect";
import { useClubsQuery } from "../../queries/clubs";
import {
  useCreateEventMutation,
  useCreateRecurringEventsMutation,
  useUpdateEventMutation,
} from "../../queries/events";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import {
  CreateEditEventFormType,
  CreateEditEventRequestType,
  EventFormInitialData,
} from "./types";

// Multi-day date range (no time-of-day) - only these two types run over several days.
const isMultiDayEventType = (type: EventType | "") => type === EventType.COMPETITION || type === EventType.SEMINARY;

// Single source for useForm's defaultValues and the reset effect below - see DogTaskForm.jsx.
const mapToFormValues = ({ name, date, endDate, type, team }: EventFormInitialData): CreateEditEventFormType => ({
  name,
  date: date ? new Date(date) : null,
  endDate: endDate ? new Date(endDate) : null,
  type,
  team: team ?? "",
  repeatsWeekly: false,
  weekdays: [],
  until: null,
});

// Mirrors the backend's own cap (recurringEvents.js) - kept in sync by hand.
const maxRecurringUntil = (startDate: Date) => {
  const max = new Date(startDate);
  max.setMonth(max.getMonth() + 3);
  return max;
};

interface Props {
  open: boolean;
  onClose: () => void;
  initialData: EventFormInitialData;
  editingId?: string;
  onSubmitOverride?: (data: CreateEditEventRequestType, editingId?: string) => Promise<void>;
}

const EventForm = ({ open, onClose, initialData, editingId, onSubmitOverride }: Props) => {
  const { t } = useTranslation();
  const { data: clubs = [] } = useClubsQuery();
  const teamOptions = clubs.map((club) => ({ value: club, label: club }));
  const createEventMutation = useCreateEventMutation();
  const createRecurringEventsMutation = useCreateRecurringEventsMutation();
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
            endDate: isMultiDayEventType(values.type) ? values.endDate : null,
            type: values.type,
            team: values.team,
          },
          editingId
        );
        handleClose();
        return;
      }

      if (!editingId && values.repeatsWeekly) {
        createRecurringEventsMutation.mutate(
          {
            name: values.name,
            date: values.date,
            type: values.type,
            weekdays: values.weekdays.map(Number),
            until: values.until,
          },
          { onSuccess: handleClose }
        );
        return;
      }

      const data: CreateEditEventRequestType = {
        name: values.name,
        date: values.date,
        endDate: isMultiDayEventType(values.type) ? values.endDate : null,
        type: values.type,
      };

      if (editingId) {
        updateEventMutation.mutate({ ...data, _id: editingId }, { onSuccess: handleClose });
      } else {
        createEventMutation.mutate(data, { onSuccess: handleClose });
      }
    },
  });

  // See DogForm.jsx for why both flags are needed.
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const typeOptions = getEventTypeOptions(t);
  const lastAutoNameRef = useRef("");

  // Reapplies initialData/editingId directly - a plain Add -> Cancel never changes that reference.
  const applyInitialValues = () => {
    const values = mapToFormValues(initialData);

    form.reset(values);

    // Auto-fill a fresh, blank session - from `values`, not a useStore read (which would lag one render).
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
  const isMultiDay = isMultiDayEventType(type);

  // New events only - reacts to the type dropdown changing mid-session, not the initial fill.
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

  const repeatsWeekly = useStore(form.store, (state) => state.values.repeatsWeekly);
  const weekdays = useStore(form.store, (state) => state.values.weekdays);
  const until = useStore(form.store, (state) => state.values.until);
  const dateValue = useStore(form.store, (state) => state.values.date);

  // Sensible one-time defaults on toggling on, both freely adjustable afterward.
  useEffect(() => {
    if (!repeatsWeekly || form.getFieldValue("weekdays").length > 0) return;

    const startDate = dateValue instanceof Date ? dateValue : new Date();
    const untilDefault = new Date(startDate);

    untilDefault.setMonth(untilDefault.getMonth() + 1);

    form.setFieldValue("weekdays", [String(startDate.getDay())]);
    form.setFieldValue("until", untilDefault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatsWeekly]);

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

        {!editingId && !onSubmitOverride && !isMultiDay && (
          <FormSwitch form={form} name="repeatsWeekly" label={t("forms.event.repeatsWeekly")} />
        )}

        {!editingId && !onSubmitOverride && !isMultiDay && repeatsWeekly && (
          <>
            <form.Field name="weekdays">
              {(field: AnyFieldApi) => (
                <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
                  {getWeekdayOptions().map((option) => {
                    const selected: boolean = field.state.value.includes(option.value);
                    return (
                      <Chip
                        key={option.value}
                        label={option.label}
                        color={selected ? "primary" : "default"}
                        variant={selected ? "filled" : "outlined"}
                        onClick={() =>
                          field.handleChange(
                            selected
                              ? field.state.value.filter((value: string) => value !== option.value)
                              : [...field.state.value, option.value]
                          )
                        }
                      />
                    );
                  })}
                </Stack>
              )}
            </form.Field>

            <form.Field name="until">
              {(field: AnyFieldApi) => (
                <DatePicker
                  label={t("forms.event.repeatUntil")}
                  value={field.state.value}
                  onChange={(value: Date | null) => field.handleChange(value)}
                  minDate={dateValue instanceof Date ? dateValue : undefined}
                  maxDate={maxRecurringUntil(dateValue instanceof Date ? dateValue : new Date())}
                />
              )}
            </form.Field>
          </>
        )}

        {isMultiDay ? (
          <>
            <form.Field name="date">
              {(field: AnyFieldApi) => (
                <DatePicker
                  label={t("forms.event.startDate")}
                  value={field.state.value}
                  onChange={(value: Date | null) => field.handleChange(value)}
                />
              )}
            </form.Field>

            <form.Field name="endDate">
              {(field: AnyFieldApi) => (
                <DatePicker
                  label={t("forms.event.endDate")}
                  value={field.state.value}
                  onChange={(value: Date | null) => field.handleChange(value)}
                  minDate={dateValue instanceof Date ? dateValue : undefined}
                  slotProps={{ field: { clearable: true } }}
                />
              )}
            </form.Field>
          </>
        ) : (
          <FormDatePicker
            form={form}
            name="date"
            label={t("common.date")}
            views={repeatsWeekly ? ["hours", "minutes"] : undefined}
          />
        )}

        {onSubmitOverride && (
          <FormSelect form={form} name="team" label={t("common.team")} multi={false} options={teamOptions} />
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
              createEventMutation.isPending ||
              updateEventMutation.isPending ||
              createRecurringEventsMutation.isPending ||
              (repeatsWeekly && (weekdays.length === 0 || !until))
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
