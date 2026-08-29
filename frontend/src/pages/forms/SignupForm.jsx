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
import FormTextField from "../../components/inputs/FormTextField";
import FormGrid from "../../components/FormGrid";
import { useNavigate } from "@tanstack/react-router";
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
        margin: "20px auto",
        backgroundColor: alpha(theme.palette.background.paper, 0.75),
        backdropFilter: "blur(6px)",
      }}
    >
      <CardContent>
        <FormGrid>
          <Typography variant="h4">Signup</Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <FormTextField form={form} name="name" label="Name" required />

          <FormTextField form={form} name="email" label="Email" required />

          <FormTextField
            form={form}
            name="password"
            label="Password"
            type="password"
            required
          />

          <FormTextField
            form={form}
            name="repeatPassword"
            label="Repeat password"
            type="password"
            validate={(currentValue) => {
              if (form.getFieldValue("password") !== currentValue) {
                return "Passwords does not match";
              }
            }}
            required
          />

          <FormTextField
            form={form}
            name="teamCode"
            label="Team code"
            validate={(currentValue) => {
              if (!validTeamCodes.includes(currentValue)) {
                return "Invalid team invitation code";
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
              Signup
            </Button>

            <Button
              size="small"
              variant="text"
              onClick={() => navigate({ to: notAuthenticatedRoutes.login })}
            >
              Login
            </Button>
          </Box>
        </FormGrid>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
