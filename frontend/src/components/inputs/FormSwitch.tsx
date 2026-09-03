import { FormControlLabel, Switch } from "@mui/material";
import React from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import { FormFieldProps } from "./utils";

interface Props extends FormFieldProps {
  label?: string;
}

const FormSwitch = ({ form, name, label }: Props) => (
  <form.Field name={name}>
    {(field: AnyFieldApi) => (
      // FormControlLabel (not a bare Switch + adjacent Typography) is what
      // gives the switch an accessible name - without it, the control has
      // none at all for screen readers or role-based lookups.
      <FormControlLabel
        control={
          <Switch
            onClick={() => field.handleChange(!field.state.value)}
            checked={!!field.state.value}
          />
        }
        label={label}
      />
    )}
  </form.Field>
);

export default FormSwitch;
