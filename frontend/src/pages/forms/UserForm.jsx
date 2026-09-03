import React, { useEffect, useState } from "react";
import { Button, DialogActions } from "@mui/material";
import { useForm, useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import FormTextField from "../../components/inputs/FormTextField";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormSelect from "../../components/inputs/FormSelect";
import TemporaryPasswordDialog from "../../components/modals/TemporaryPasswordDialog";
import { useDogsQuery } from "../../queries/dogs";
import { useUpdateUserMutation } from "../../queries/users";
import { resolveDogsByIds } from "../../helpers/dogs";
import { Roles } from "../../helpers/types";
import { CLUBS } from "../../helpers/teams";
import { useConfirmModalSoft } from "../../hooks/useConfirmModal";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";

const teamOptions = CLUBS.map((club) => ({ value: club, label: club }));
const roleOptions = Object.values(Roles).map((role) => ({
  value: role,
  label: role,
}));

// useForm's `defaultValues` and this form's own `form.reset()` calls must
// always agree on shape - TanStack Form's internal update effect re-syncs
// the store to `defaultValues` on every render, so if `defaultValues` still
// held raw Dog objects while `reset()` set id strings, the two would fight
// and the dogs field would randomly end up holding objects, not ids.
const mapToFormValues = ({ name, dogs, team, roles }) => ({
  name,
  dogs: dogs.map(({ _id }) => _id),
  team: team ?? "",
  roles: roles ?? [],
});

const UserForm = ({
  open,
  onClose,
  initialData,
  editingId,
  dogsOverride,
  onSubmitOverride,
  onResetPassword,
}) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const confirmSoft = useConfirmModalSoft();
  const { data: contextDogs = [] } = useDogsQuery();
  const updateUserMutation = useUpdateUserMutation();
  const dogs = dogsOverride ?? contextDogs;
  const submitGuard = useSubmitGuard();

  const [temporaryPassword, setTemporaryPassword] = useState(null);
  const [resetPending, setResetPending] = useState(false);

  // Edit-only: a user account is only ever created via signup (see
  // SignupForm.jsx) - this form always opens against an existing user,
  // whether from trainer-panel/Users.jsx (click-to-edit a card, no "add"
  // entry point at all) or the super-admin grid (`allowAdd={false}` for
  // this entity, so onEditClick is the only way in there too).
  const form = useForm({
    defaultValues: mapToFormValues(initialData),
    onSubmit: async ({ value: values }) => {
      const selectedDogs = resolveDogsByIds(values.dogs, dogs);

      // Team/roles reassignment is super-admin only (onSubmitOverride).
      if (onSubmitOverride) {
        await onSubmitOverride(
          {
            name: values.name,
            dogs: selectedDogs,
            team: values.team,
            roles: values.roles,
          },
          editingId
        );
        handleClose();
        return;
      }

      updateUserMutation.mutate(
        { name: values.name, dogs: selectedDogs, _id: editingId },
        { onSuccess: handleClose }
      );
    },
  });

  // See DogForm.jsx for why both flags are needed.
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  useEffect(() => {
    form.reset(mapToFormValues(initialData));
  }, [initialData, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onResetPasswordClick = async () => {
    try {
      await confirmSoft(t("forms.user.resetPasswordConfirm"));
    } catch {
      return;
    }

    setResetPending(true);

    try {
      const { temporaryPassword: newPassword } = await onResetPassword(editingId);

      setTemporaryPassword(newPassword);
    } catch {
      enqueueSnackbar(t("forms.user.resetPasswordFailed"), { variant: "error" });
    } finally {
      setResetPending(false);
    }
  };

  return (
    <FormModal
      onClose={handleClose}
      open={open}
      // Edit-only in practice (see the comment above) - always the edit
      // title - but keeps the same add/edit shape as every other form.
      title={editingId ? t("forms.user.editTitle") : t("forms.user.addTitle")}
    >
      <FormGrid>
        <FormTextField form={form} name="name" label={t("common.name")} required />

        <FormSelect
          form={form}
          name="dogs"
          label={t("common.dogs")}
          options={dogs.map(({ name, _id }) => ({ value: _id, label: name }))}
        />

        {onSubmitOverride && (
          <>
            <FormSelect
              form={form}
              name="roles"
              label={t("common.roles")}
              options={roleOptions}
            />

            <FormSelect
              form={form}
              name="team"
              label={t("common.team")}
              multi={false}
              options={teamOptions}
            />
          </>
        )}

        <DialogActions sx={{ padding: 0 }}>
          {onResetPassword && editingId && (
            <Button
              size="medium"
              color="warning"
              disabled={resetPending}
              onClick={onResetPasswordClick}
              sx={{ marginRight: "auto" }}
            >
              {t("forms.user.resetPassword")}
            </Button>
          )}

          <Button size="medium" variant="outlined" onClick={handleClose}>
            {t("common.cancel")}
          </Button>

          <Button
            size="medium"
            variant="contained"
            disabled={isSubmitting || updateUserMutation.isPending}
            onClick={() => submitGuard(() => form.handleSubmit())}
          >
            {t("common.submit")}
          </Button>
        </DialogActions>
      </FormGrid>

      <TemporaryPasswordDialog
        temporaryPassword={temporaryPassword}
        onClose={() => setTemporaryPassword(null)}
      />
    </FormModal>
  );
};

export default UserForm;
