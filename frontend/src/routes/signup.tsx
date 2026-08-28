import { createFileRoute } from "@tanstack/react-router";
import SignupForm from "../pages/forms/SignupForm";

export const Route = createFileRoute("/signup")({
  component: SignupForm,
});
