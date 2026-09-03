import React from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import FormTextField from "../../components/inputs/FormTextField";
import FormGrid from "../../components/FormGrid";
import { useNavigate } from "@tanstack/react-router";
import { notAuthenticatedRoutes, pitchRoute } from "../../helpers/routesAndPaths";
import { useSignup } from "../../hooks/useSignup";
import { useClubCodesQuery } from "../../queries/clubCodes";

const SignupForm = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { signup, loading, error } = useSignup();
  // Single source of truth is the backend's own teamCodeMap (see
  // userModel.js) - fetched instead of duplicated here, so the two can't
  // silently drift out of sync across two independent deployments (frontend
  // on Vercel, backend on Heroku, no shared build step between them).
  // Skip this field's own validation unless the list has actually loaded
  // successfully - while it's still loading OR if the fetch fails outright,
  // `validTeamCodes` is undefined, and `!undefined?.includes(...)` is always
  // true, which would otherwise flag every code (including correct ones) as
  // invalid and block signup entirely over what should be a non-blocking
  // convenience check. The backend is the real authority on submit either way.
  const { data: validTeamCodes, isSuccess: clubCodesLoaded } = useClubCodesQuery();

  const form = useForm({
    defaultValues: {
      name: "",
      password: "",
      email: "",
      repeatPassword: "",
      teamCode: "",
    },
    onSubmit: async ({ value: { name, password, email, teamCode } }) => {
      await signup(name, email, password, teamCode);
    },
  });

  return (
    <Card
      sx={{
        minWidth: 300,
        maxWidth: 400,
        margin: "20px auto",
        backgroundColor: alpha(theme.palette.background.paper, 0.75),
        backdropFilter: "blur(6px)",
      }}
    >
      <CardContent>
        <FormGrid>
          <Typography variant="h4">{t("forms.signup.title")}</Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <FormTextField
            form={form}
            name="name"
            label={t("common.name")}
            required
          />

          <FormTextField
            form={form}
            name="email"
            label={t("common.email")}
            required
          />

          <FormTextField
            form={form}
            name="password"
            label={t("common.password")}
            type="password"
            required
          />

          <FormTextField
            form={form}
            name="repeatPassword"
            label={t("forms.signup.repeatPassword")}
            type="password"
            validate={(currentValue) => {
              if (form.getFieldValue("password") !== currentValue) {
                return t("forms.signup.passwordMismatch");
              }
            }}
            required
          />

          <FormTextField
            form={form}
            name="teamCode"
            label={t("forms.signup.clubCode")}
            validate={(currentValue) => {
              if (!clubCodesLoaded) return;

              if (!validTeamCodes?.includes(currentValue)) {
                return t("forms.signup.invalidClubCode");
              }
            }}
            required
          />

          <Box sx={{ display: "grid", gridGap: theme.spacing(2) }}>
            <Button
              disabled={loading}
              size="medium"
              variant="contained"
              onClick={() => form.handleSubmit()}
            >
              {t("forms.signup.submit")}
            </Button>

            <Button
              size="small"
              variant="text"
              onClick={() => navigate({ to: notAuthenticatedRoutes.login })}
            >
              {t("forms.signup.login")}
            </Button>

            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={() => navigate({ to: pitchRoute })}
            >
              {t("pitch.linkLabel")}
            </Button>
          </Box>
        </FormGrid>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
