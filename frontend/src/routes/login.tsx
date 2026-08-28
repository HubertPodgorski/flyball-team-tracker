import { createFileRoute } from "@tanstack/react-router";
import LoginForm from "../pages/forms/LoginForm";

export const Route = createFileRoute("/login")({
  component: LoginForm,
});
