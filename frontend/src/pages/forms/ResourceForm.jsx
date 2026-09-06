import React, { useEffect } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm, useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormSelect from "../../components/inputs/FormSelect";
import { useClubsQuery } from "../../queries/clubs";
import {
  useCreateResourceMutation,
  useUpdateResourceMutation,
} from "../../queries/resources";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";

const mapToFormValues = ({ name, url, team }) => ({
  name,
  url: url ?? "",
  team: team ?? "",
});

const ResourceForm = ({
  open,
  onClose,
  initialData,
  editingId,
  onSubmitOverride,
}) => {
  const { t } = useTranslation();
  const { data: clubs = [] } = useClubsQuery();
  const teamOptions = clubs.map((club) => ({ value: club, label: club }));
  const createResourceMutation = useCreateResourceMutation();
  const updateResourceMutation = useUpdateResourceMutation();
  const submitGuard = useSubmitGuard();

  const form = useForm({
    defaultValues: mapToFormValues(initialData),
    onSubmit: async ({ value: values }) => {
      // Team reassignment is super-admin only (onSubmitOverride).
      if (onSubmitOverride) {
        await onSubmitOverride(
          { name: values.name, url: values.url, team: values.team },
          editingId
        );
        handleClose();
        return;
      }

      const data = { name: values.name, url: values.url };

      if (editingId) {
        updateResourceMutation.mutate(
          { _id: editingId, ...data },
          { onSuccess: handleClose }
        );
      } else {
        createResourceMutation.mutate(data, { onSuccess: handleClose });
      }
    },
  });

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
      title={editingId ? t("forms.resource.editTitle") : t("forms.resource.addTitle")}
    >
      <FormGrid>
        <FormTextField
          form={form}
          name="name"
          label={t("forms.resource.name")}
          required
        />

        <FormTextField
          form={form}
          name="url"
          label={t("forms.resource.url")}
          required
          validate={(value) =>
            /^\S+\.\S+$/.test(value) ? undefined : t("forms.resource.invalidUrl")
          }
        />

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
              isSubmitting ||
              createResourceMutation.isPending ||
              updateResourceMutation.isPending
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

export default ResourceForm;
