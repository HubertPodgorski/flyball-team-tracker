import React, { useMemo } from "react";
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
import { useNavigate } from "react-router-dom";
import { notAuthenticatedRoutes } from "../../helpers/routesAndPaths";
import { useSignup } from "../../hooks/useSignup";

const validTeamCodes = [
  "DZIKIEGZIKI",
  "TEST",
  "DZIKIE_GZIKI_NABOR",
  "WEST_SIDE_DOGZ",
  "FLYVENGERS",
];

const SignupForm = () => {
  const theme = useTheme();

  const navigate = useNavigate();
  const { signup, loading, error } = useSignup();

  const formMethods = useForm({
    defaultValues: {
      name: "",
      password: "",
      email: "",
      repeatPassword: "",
      teamCode: "",
    },
  });

  const { handleSubmit, watch } = useMemo(() => formMethods, [formMethods]);

  const onSubmit = async ({ name, password, email, teamCode }) => {
    await signup(name, email, password, teamCode);
  };

  return (
    <FormProvider {...formMethods}>
      <Card sx={{ minWidth: 300, margin: "20px auto" }}>
        <CardContent>
          <FormGrid>
            <Typography variant="h4">Signup</Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <FormTextField name="name" label="Name" required />

            <FormTextField name="email" label="Email" required />

            <FormTextField
              name="password"
              label="Password"
              type="password"
              required
            />

            <FormTextField
              name="repeatPassword"
              label="Repeat password"
              type="password"
              rules={{
                validate: (currentValue) => {
                  if (watch("password") !== currentValue) {
                    return "Passwords does not match";
                  }
                },
              }}
              required
            />

            <FormTextField
              rules={{
                validate: (currentValue) => {
                  if (!validTeamCodes.includes(currentValue)) {
                    return "Invalid team invitation code";
                  }
                },
              }}
              name="teamCode"
              label="Team code"
              required
            />

            <Box sx={{ display: "grid", gridGap: theme.spacing(2) }}>
              <Button
                disabled={loading}
                size="medium"
                variant="contained"
                onClick={handleSubmit(onSubmit)}
              >
                Signup
              </Button>

              <Button
                size="small"
                variant="text"
                onClick={() => navigate(notAuthenticatedRoutes.login)}
              >
                Login
              </Button>
            </Box>
          </FormGrid>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

export default SignupForm;
