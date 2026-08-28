import React from "react";
import { TextField } from "@mui/material";
import type { AnyFieldApi } from "@tanstack/react-form";
import { FormFieldProps, getFieldErrorMessage } from "./utils";

interface Props extends FormFieldProps {
  label: string;
  required?: boolean;
  type?: string;
  validate?: (value: string) => string | undefined;
  rows?: number;
}

const FormTextField = ({
  form,
  name,
  label,
  required = false,
  type,
  validate,
  rows = 1,
}: Props) => (
  <form.Field
    name={name}
    validators={{
      onChange: ({ value }: { value: string }) => {
        if (required && !value) return "This field is required";

        return validate?.(value);
      },
    }}
  >
    {(field: AnyFieldApi) => (
      <TextField
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        value={field.state.value ?? ""}
        label={label}
        required={required}
        type={type}
        error={field.state.meta.errors.length > 0}
        helperText={getFieldErrorMessage(field)}
        multiline={rows > 1}
        rows={rows}
      />
    )}
  </form.Field>
);

export default FormTextField;
