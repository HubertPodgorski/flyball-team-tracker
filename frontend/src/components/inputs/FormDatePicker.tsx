import React from "react";
import { StaticDateTimePicker } from "@mui/x-date-pickers";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { FormFieldProps } from "./utils";

type DateOrTimeView = "year" | "month" | "day" | "hours" | "minutes" | "seconds";

interface Props extends FormFieldProps {
  label: string;
  required?: boolean;
  views?: DateOrTimeView[]; // time-only ["hours", "minutes"] when the day is picked elsewhere
}

// StaticDateTimePicker has no text field of its own (it's always rendered
// inline, not behind a popup), so it has no `label` prop — `label` here is
// unused, kept only so callers don't need to special-case this field.
const FormDatePicker = ({ form, name, required, views }: Props) => {
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
          key={views?.join(",") ?? "full"} // remount so narrowing `views` mid-session resets its uncontrolled view state
          displayStaticWrapperAs="mobile"
          openTo={views ? views[0] : "day"}
          views={views}
          value={field.state.value}
          onChange={field.handleChange}
          slots={{ actionBar: () => null }}
          // Time-only mode centers the clock - the content wrapper is a column flex, so alignItems does it.
          sx={views ? { "& .MuiPickersLayout-contentWrapper": { alignItems: "center" } } : undefined}
        />
      )}
    </form.Field>
  );
};

export default FormDatePicker;
