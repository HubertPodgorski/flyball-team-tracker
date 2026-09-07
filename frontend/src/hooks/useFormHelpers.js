import { useState } from "react";

export const useFormHelpers = (initialFormData) => {
  const [formInitialData, setFormInitialData] = useState(initialFormData);
  const [editingId, setEditingId] = useState();
  const [formOpen, setFormOpen] = useState(false);

  // Not async - these are plain useState setters, not promises. Awaiting
  // each one still yields a microtask tick, splitting one batched update
  // into several renders that briefly expose inconsistent props.
  const onEditClick = (formEditInitialData, id) => {
    setFormInitialData(formEditInitialData);
    setEditingId(id);
    setFormOpen(true);
  };

  const onFormClose = () => {
    setFormOpen(false);
    setEditingId(undefined);
    setFormInitialData(initialFormData);
  };

  return {
    formInitialData,
    editingId,
    formOpen,
    setFormOpen,
    onEditClick,
    onFormClose,
  };
};
