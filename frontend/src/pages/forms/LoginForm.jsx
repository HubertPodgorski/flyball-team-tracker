import React, { useEffect, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
} from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import FormTextField from "../../components/inputs/FormTextField";
import FormGrid from "../../components/FormGrid";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useNavigate } from "react-router-dom";
import {
  notAuthenticatedRoutes,
  userPaths,
} from "../../helpers/routesAndPaths";
import { useLogin } from "../../hooks/useLogin";

const LoginForm = () => {
  const theme = useTheme();

  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { login, loading, error } = useLogin();

  useEffect(() => {
    const initialLocation = JSON.parse(
      localStorage.getItem("initial-location")
    );

    if (user) {
      navigate(initialLocation?.pathname || userPaths.tasks);
    }
  }, [navigate, user]);

  const formMethods = useForm({
    defaultValues: { password: "", email: "" },
  });

  const { handleSubmit } = useMemo(() => formMethods, [formMethods]);

  const onSubmit = async ({ password, email }) => {
    await login(email, password);
  };

  return (
    <FormProvider {...formMethods}>
      <Card sx={{ minWidth: 300, margin: "20px auto" }}>
        <CardContent>
          <FormGrid>
            <Typography variant="h4">Login</Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <FormTextField name="email" label="Email" required />

            <FormTextField
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
                onClick={handleSubmit(onSubmit)}
              >
                Login
              </Button>

              <Button
                size="small"
                variant="text"
                onClick={() => {
                  navigate(notAuthenticatedRoutes.signup);
                }}
              >
                Signup
              </Button>
            </Box>
          </FormGrid>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

export default LoginForm;
