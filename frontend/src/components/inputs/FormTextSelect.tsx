import React from "react";
import { Autocomplete, TextField } from "@mui/material";
import type { AnyFieldApi } from "@tanstack/react-form";
import { SelectOption } from "./types";
import { FormFieldProps } from "./utils";

interface Props extends FormFieldProps {
  options: SelectOption[];
  label: string;
}

const FormTextSelect = ({ form, name, options, label }: Props) => (
  <form.Field name={name}>
    {(field: AnyFieldApi) => (
      <Autocomplete
        onChange={(event, value: string) => field.handleChange(value)}
        value={field.state.value}
        freeSolo
        options={options.map(({ value }) => value)}
        renderInput={(params) => (
          <TextField
            {...params}
            onChange={(event) => field.handleChange(event.target.value)}
            label={label}
          />
        )}
      />
    )}
  </form.Field>
);

export default FormTextSelect;
