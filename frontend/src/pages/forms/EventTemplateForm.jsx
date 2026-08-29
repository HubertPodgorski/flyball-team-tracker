import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import { useAppContext } from "../../hooks/useAppContext";
import { getFormattedDate } from "../../helpers/calendar";
import { handleError } from "../../helpers/errorHandler";
import { useSnackbar } from "notistack";
import FormSingleAutocomplete from "../../components/inputs/FormSingleAutocomplete";
import { useSocketContext } from "../../hooks/useSocketContext";

const EventTemplateForm = ({
  open,
  onClose,
  initialData,
  editingId,
  onSubmitOverride,
}) => {
  const { events, eventTemplates } = useAppContext();
  const { socket } = useSocketContext();

  const { enqueueSnackbar } = useSnackbar();

  const form = useForm({
    defaultValues: initialData,
    onSubmit: async ({ value: { name } }) => {
      const data = { name };

      if (onSubmitOverride) {
        await onSubmitOverride(data, editingId);
        onClose();
        return;
      }

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
    },
  });

  useEffect(() => {
    const { name } = initialData;

    form.reset({ name });
  }, [initialData, form]);

  // TODO: add template names already created and remove duplicates here
  const eventNamesOptions = [...events, ...eventTemplates].reduce(
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

  return (
    <FormModal
      onClose={onClose}
      open={open}
      title="Add or update event template"
    >
      <FormGrid>
        <FormSingleAutocomplete
          form={form}
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
            onClick={() => form.handleSubmit()}
          >
            Submit
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default EventTemplateForm;
