import React, { useEffect } from "react";
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
import { useAuthContext } from "../../hooks/useAuthContext";
import { useNavigate } from "@tanstack/react-router";
import {
  notAuthenticatedRoutes,
  userRoutes,
} from "../../helpers/routesAndPaths";
import { useLogin } from "../../hooks/useLogin";

const isAuthPath = (pathname) =>
  pathname === notAuthenticatedRoutes.login ||
  pathname === notAuthenticatedRoutes.signup;

const LoginForm = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { login, loading, error } = useLogin();

  useEffect(() => {
    const initialLocation = JSON.parse(
      localStorage.getItem("initial-location")
    );
    const initialPathname = initialLocation?.pathname;

    if (user) {
      navigate({
        to:
          initialPathname && !isAuthPath(initialPathname)
            ? initialPathname
            : userRoutes.tasks,
      });
      localStorage.removeItem("initial-location");
    }
  }, [navigate, user]);

  const form = useForm({
    defaultValues: { password: "", email: "" },
    onSubmit: async ({ value: { password, email } }) => {
      await login(email, password);
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
          <Typography variant="h4">{t("forms.login.title")}</Typography>

          {error && <Alert severity="error">{error}</Alert>}

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

          <Box sx={{ display: "grid", gridGap: theme.spacing(2) }}>
            <Button
              disabled={loading}
              size="medium"
              variant="contained"
              onClick={() => form.handleSubmit()}
            >
              {t("forms.login.submit")}
            </Button>

            <Button
              size="small"
              variant="text"
              onClick={() => {
                navigate({ to: notAuthenticatedRoutes.signup });
              }}
            >
              {t("forms.login.signup")}
            </Button>
          </Box>
        </FormGrid>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
