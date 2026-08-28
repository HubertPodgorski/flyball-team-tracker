import { useState } from "react";

export const useFormHelpers = (initialFormData) => {
  const [formInitialData, setFormInitialData] = useState(initialFormData);
  const [editingId, setEditingId] = useState();
  const [formOpen, setFormOpen] = useState(false);

  const onEditClick = async (formEditInitialData, id) => {
    await setFormInitialData(formEditInitialData);

    await setEditingId(id);

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
