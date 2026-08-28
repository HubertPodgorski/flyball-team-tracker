import React, { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import FormSelect from "../inputs/FormSelect";
import { useAppContext } from "../../hooks/useAppContext";
import { Box, Button, useTheme } from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useSocketContext } from "../../hooks/useSocketContext";

const EventTemplateSelector = () => {
  const { socket } = useSocketContext();

  const theme = useTheme();
  const { eventTemplates } = useAppContext();

  const confirm = useConfirm();

  const formMethods = useForm({
    defaultValues: { eventTemplate: [] },
  });

  const selectedEventTemplateId = formMethods.watch("eventTemplate");

  const isEventTemplateSelected = useMemo(
    () => !!selectedEventTemplateId && selectedEventTemplateId.length > 0,
    [selectedEventTemplateId]
  );

  const onLoadButtonClick = async () => {
    if (!isEventTemplateSelected) return;

    await confirm({
      description: "Loading template will overwrite current tasks",
      confirmationButtonProps: { color: "success", variant: "contained" },
      confirmationText: "Load template",
      cancellationText: "No thanks",
    });

    // load_tasks_from_event_template
    await socket.emit("load_tasks_from_event_template", {
      eventTemplateId: selectedEventTemplateId,
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gridGap: theme.spacing(1),
      }}
    >
      <FormProvider {...formMethods}>
        <FormSelect
          multi={false}
          name="eventTemplate"
          label="Event template"
          options={[
            { value: "", label: "Brak" },
            ...eventTemplates.map(({ name: label, _id: value }) => ({
              value,
              label,
            })),
          ]}
        />
      </FormProvider>

      <Button disabled={!isEventTemplateSelected} onClick={onLoadButtonClick}>
        {isEventTemplateSelected && "Load event template"}

        {!isEventTemplateSelected && "Select template first"}
      </Button>
    </Box>
  );
};

export default EventTemplateSelector;
