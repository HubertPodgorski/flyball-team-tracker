import React from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { FormFieldProps, getFieldErrorMessage } from "./utils";
import ClearableTextField from "./ClearableTextField";

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
}: Props) => {
  const { t } = useTranslation();

  return (
  <form.Field
    name={name}
    validators={{
      onChange: ({ value }: { value: string }) => {
        if (required && !value) return t("common.requiredField");

        return validate?.(value);
      },
    }}
  >
    {(field: AnyFieldApi) => (
      <ClearableTextField
        onChange={(value) => field.handleChange(value)}
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
};

export default FormTextField;
