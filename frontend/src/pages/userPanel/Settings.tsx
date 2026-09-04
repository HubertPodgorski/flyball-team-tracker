import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useIsSuperAdmin } from "../../hooks/useIsSuperAdmin";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import { useDogsQuery, useUpdateDogMutation } from "../../queries/dogs";
import { useChangeOwnPasswordMutation, useUpdateUserMutation } from "../../queries/users";
import { getAuthErrorMessage } from "../../helpers/authErrors";
import FormTextField from "../../components/inputs/FormTextField";
import FormGrid from "../../components/FormGrid";
import { Dog } from "../../helpers/types";

const LANGUAGE_OPTIONS = [
  { value: "pl", label: "Polski" },
  { value: "en", label: "English" },
] as const;

const Settings = () => {
  const { user, setUserLanguage } = useAuthContext();
  const isSuperAdmin = useIsSuperAdmin();
  const { isStandalone, isIos, canPromptInstall, promptInstall } = usePwaInstall();
  const { data: dogs = [] } = useDogsQuery();
  const updateUserMutation = useUpdateUserMutation();
  const updateDogMutation = useUpdateDogMutation();
  const changePasswordMutation = useChangeOwnPasswordMutation();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const changePasswordForm = useForm({
    defaultValues: { currentPassword: "", newPassword: "", repeatNewPassword: "" },
    onSubmit: async ({ value: { currentPassword, newPassword } }) => {
      try {
        await changePasswordMutation.mutateAsync({ currentPassword, newPassword });

        enqueueSnackbar(t("settings.changePasswordSuccess"), { variant: "success" });
        changePasswordForm.reset();
      } catch (error) {
        enqueueSnackbar(getAuthErrorMessage(error, t), { variant: "error" });
      }
    },
  });

  const [pickedDogIds, setPickedDogIds] = useState<string[]>([]);
  const [ownDogs, setOwnDogs] = useState<Dog[]>(user?.dogs ?? []);

  // Derived fresh from the live query every render (not a snapshot taken at
  // pick time) - otherwise a toggle here wouldn't visibly flip until reload,
  // since it'd be reading a stale copy instead of the just-updated cache.
  const pickedDogs = dogs.filter(({ _id }) => pickedDogIds.includes(_id));

  // Mirrors MyDogs.tsx - re-derive from the live dogs list rather than
  // trusting `user.dogs` alone, so a jump-height/sync edit elsewhere shows
  // up here without needing a fresh login.
  useEffect(() => {
    if (!user) return;

    const ownDogIds = user.dogs.map(({ _id }) => _id);

    setOwnDogs(dogs.filter(({ _id }) => ownDogIds.includes(_id)));
  }, [user, dogs]);

  // Super-admins have no dogs of their own - let them pick any dogs instead.
  const dogsToShow = isSuperAdmin ? pickedDogs : ownDogs;

  const onLanguageChange = (language: "en" | "pl") => {
    setUserLanguage(language);

    updateUserMutation.mutate(
      { _id: user!._id, language },
      {
        onError: () =>
          enqueueSnackbar(t("settings.saveFailed"), { variant: "error" }),
      }
    );
  };

  const onSyncChange = (dogId: string, field: "syncCrossPasses" | "syncCrossPassesWithMyDogs", value: boolean) => {
    updateDogMutation.mutate(
      { _id: dogId, [field]: value },
      {
        onError: () => enqueueSnackbar(t("settings.saveFailed"), { variant: "error" }),
      }
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5">{t("nav.settings")}</Typography>

      <FormControl fullWidth sx={{ maxWidth: 300 }}>
        <InputLabel id="language-select-label">
          {t("settings.language")}
        </InputLabel>
        <Select
          labelId="language-select-label"
          label={t("settings.language")}
          value={user?.language ?? "pl"}
          onChange={(event) =>
            onLanguageChange(event.target.value as "en" | "pl")
          }
        >
          {LANGUAGE_OPTIONS.map(({ value, label }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!isStandalone && (canPromptInstall || isIos) && (
        <>
          <Divider />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxWidth: 300 }}>
            <Typography variant="h6">{t("settings.installAppTitle")}</Typography>

            {canPromptInstall ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.installAppHint")}
                </Typography>
                <Button
                  variant="contained"
                  onClick={promptInstall}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {t("settings.installAppAction")}
                </Button>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("settings.installAppIosHint")}
              </Typography>
            )}
          </Box>
        </>
      )}

      <Divider />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxWidth: 300 }}>
        <Typography variant="h6">{t("settings.changePasswordTitle")}</Typography>

        <FormGrid>
          <FormTextField
            form={changePasswordForm}
            name="currentPassword"
            label={t("settings.currentPassword")}
            type="password"
            required
          />

          <FormTextField
            form={changePasswordForm}
            name="newPassword"
            label={t("settings.newPassword")}
            type="password"
            required
          />

          <FormTextField
            form={changePasswordForm}
            name="repeatNewPassword"
            label={t("settings.repeatNewPassword")}
            type="password"
            required
            validate={(currentValue) => {
              if (changePasswordForm.getFieldValue("newPassword") !== currentValue) {
                return t("settings.passwordMismatch");
              }

              return undefined;
            }}
          />

          <Button
            variant="contained"
            disabled={changePasswordMutation.isPending}
            onClick={() => changePasswordForm.handleSubmit()}
            sx={{ alignSelf: "flex-start" }}
          >
            {t("settings.changePasswordSubmit")}
          </Button>
        </FormGrid>
      </Box>

      {(isSuperAdmin || ownDogs.length > 0) && (
        <>
          <Divider />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="h6">{t("settings.crossPassSyncTitle")}</Typography>

            <Typography variant="body2" color="text.secondary">
              {t("settings.crossPassSyncHint")}
            </Typography>

            {isSuperAdmin && (
              <Autocomplete
                multiple
                options={dogs}
                getOptionLabel={(dog) => dog.name}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                value={pickedDogs}
                onChange={(_event, newDogs) => setPickedDogIds(newDogs.map(({ _id }) => _id))}
                renderInput={(params) => (
                  <TextField {...params} label={t("pages.myDogs.dogLabel")} />
                )}
                sx={{ maxWidth: 300 }}
              />
            )}

            {dogsToShow.map((dog) => (
              <Box key={dog._id} sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="subtitle2">{dog.name}</Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={!!dog.syncCrossPasses}
                      onChange={(event) =>
                        onSyncChange(dog._id, "syncCrossPasses", event.target.checked)
                      }
                    />
                  }
                  label={t("settings.crossPassSyncLineupsLabel")}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={!!dog.syncCrossPassesWithMyDogs}
                      onChange={(event) =>
                        onSyncChange(
                          dog._id,
                          "syncCrossPassesWithMyDogs",
                          event.target.checked
                        )
                      }
                    />
                  }
                  label={t("settings.crossPassSyncMyDogsLabel")}
                />
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Settings;
