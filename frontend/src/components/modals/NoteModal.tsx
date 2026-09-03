import React, { useEffect } from "react";
import { Dog } from "../../helpers/types";
import { Button, DialogActions } from "@mui/material";
import { useUpdateDogMutation } from "../../queries/dogs";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import FormModal from "./../FormModal.jsx";
import FormGrid from "./../FormGrid.jsx";
import FormTextField from "./../inputs/FormTextField.jsx";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";

interface Props {
  open: boolean;
  onClose: () => void;
  dog?: Dog;
}

interface FormData {
  note: string;
}

const NoteModal = ({ dog, open, onClose }: Props) => {
  const { t } = useTranslation();
  const updateDogMutation = useUpdateDogMutation();
  const submitGuard = useSubmitGuard();

  const form = useForm({
    defaultValues: { note: dog?.note || "" } as FormData,
    onSubmit: async ({ value: { note } }) => {
      if (!dog) return;

      updateDogMutation.mutate(
        { _id: dog._id, note: note || "" },
        { onSuccess: onClose }
      );
    },
  });

  useEffect(() => {
    if (!dog) return;

    form.reset({ note: dog.note || "" });
  }, [dog, form]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("modals.note.title", {
        name: dog?.name ?? t("modals.note.fallbackName"),
      })}
    >
      <FormGrid>
        <FormTextField form={form} name="note" label={t("modals.note.notes")} rows={5} />

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={onClose}>
            {t("common.cancel")}
          </Button>

          <Button
            size="medium"
            variant="contained"
            disabled={updateDogMutation.isPending}
            onClick={() => submitGuard(() => form.handleSubmit())}
          >
            {t("modals.note.save")}
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default NoteModal;
