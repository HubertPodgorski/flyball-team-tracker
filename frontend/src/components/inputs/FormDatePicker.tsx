import React from "react";
import { StaticDateTimePicker } from "@mui/x-date-pickers";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { FormFieldProps } from "./utils";

interface Props extends FormFieldProps {
  label: string;
  required?: boolean;
}

// StaticDateTimePicker has no text field of its own (it's always rendered
// inline, not behind a popup), so it has no `label` prop — `label` here is
// unused, kept only so callers don't need to special-case this field.
const FormDatePicker = ({ form, name, required }: Props) => {
  const { t } = useTranslation();

  return (
    <form.Field
      name={name}
      validators={{
        onChange: ({ value }: { value: unknown }) =>
          required && !value ? t("common.requiredField") : undefined,
      }}
    >
      {(field: AnyFieldApi) => (
        <StaticDateTimePicker
          displayStaticWrapperAs="mobile"
          openTo="day"
          value={field.state.value}
          onChange={field.handleChange}
          slots={{ actionBar: () => null }}
        />
      )}
    </form.Field>
  );
};

export default FormDatePicker;
