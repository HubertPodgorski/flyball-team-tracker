import React, { useEffect, useMemo } from "react";
import { Button, DialogActions } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import { useAppContext } from "../../hooks/useAppContext";
import { getFormattedDate } from "../../helpers/calendar";
import { handleError } from "../../helpers/errorHandler";
import { useSnackbar } from "notistack";
import FormSingleAutocomplete from "../../components/inputs/FormSingleAutocomplete";
import { useSocketContext } from "../../hooks/useSocketContext";

const EventTemplateForm = ({ open, onClose, initialData, editingId }) => {
  const { events, eventTemplates } = useAppContext();
  const { socket } = useSocketContext();

  const { enqueueSnackbar } = useSnackbar();

  const formMethods = useForm({
    defaultValues: initialData,
  });

  const { handleSubmit, reset } = useMemo(() => formMethods, [formMethods]);

  useEffect(() => {
    const { name } = initialData;

    reset({ name });
  }, [initialData, reset]);

  const onSubmit = async ({ name }) => {
    const data = { name };

    if (editingId) {
      await socket.emit(
        "update_event_template",
        { _id: editingId, ...data },
        // TODO: not necessary as it always do something (either update existing or create new one)
        handleError(
          (error) => {
            enqueueSnackbar(error, { variant: "error" });
          },
          () => onClose()
        )
      );
    } else {
      await socket.emit(
        "add_event_template",
        data,
        // TODO: not necessary as it always do something (either update existing or create new one)
        handleError(
          (error) => {
            enqueueSnackbar(error, { variant: "error" });
          },
          () => onClose()
        )
      );
    }

    // TODO: error handling eventually?
  };

  // TODO: add template names already created and remove duplicates here
  const eventNamesOptions = useMemo(() => {
    return [...events, ...eventTemplates].reduce(
      (uniqueEventTemplateNameSuggestions, currentValue) => {
        const nameToCompare =
          "date" in currentValue
            ? `${currentValue.name} ${getFormattedDate(currentValue.date)}`
            : currentValue.name;

        if (
          uniqueEventTemplateNameSuggestions.some(
            ({ value }) => value === nameToCompare
          )
        )
          return uniqueEventTemplateNameSuggestions;

        return [
          ...uniqueEventTemplateNameSuggestions,
          { value: nameToCompare, label: nameToCompare },
        ];
      },
      []
    );
  }, [events, eventTemplates]);

  return (
    <FormProvider {...formMethods}>
      <FormModal
        onClose={onClose}
        open={open}
        title="Add or update event template"
      >
        <FormGrid>
          <FormSingleAutocomplete
            required
            name="name"
            label="Template name"
            multi={false}
            options={eventNamesOptions}
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

export default EventTemplateForm;
