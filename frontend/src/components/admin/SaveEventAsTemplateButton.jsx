import React from "react";
import { Button } from "@mui/material";
import EventTemplateForm from "../../pages/forms/EventTemplateForm";
import { useFormHelpers } from "../../hooks/useFormHelpers";

const SaveEventAsTemplateButton = () => {
  const {
    formOpen: eventTemplateFormOpen,
    setFormOpen: setEventTemplateFormOpen,
    onFormClose: onEventTemplateFormClose,
    formInitialData: eventTemplateFormInitialData,
  } = useFormHelpers({
    name: "",
  });

  return (
    <>
      <Button
        variant="contained"
        color="info"
        onClick={() => setEventTemplateFormOpen(true)}
      >
        Save current tasks as template
      </Button>

      <EventTemplateForm
        open={eventTemplateFormOpen}
        onClose={onEventTemplateFormClose}
        initialData={eventTemplateFormInitialData}
      />
    </>
  );
};

export default SaveEventAsTemplateButton;
