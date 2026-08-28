import React, { useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
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
    <Card sx={{ minWidth: 300, margin: "20px auto" }}>
      <CardContent>
        <FormGrid>
          <Typography variant="h4">Login</Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <FormTextField form={form} name="email" label="Email" required />

          <FormTextField
            form={form}
            name="password"
            label="Password"
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
              Login
            </Button>

            <Button
              size="small"
              variant="text"
              onClick={() => {
                navigate({ to: notAuthenticatedRoutes.signup });
              }}
            >
              Signup
            </Button>
          </Box>
        </FormGrid>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
