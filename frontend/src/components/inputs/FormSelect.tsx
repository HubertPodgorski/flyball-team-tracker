import React from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { AnyFieldApi } from "@tanstack/react-form";
import { FormFieldProps } from "./utils";
import { SelectOption } from "./types";

interface Props extends FormFieldProps {
  options: SelectOption[];
  label: string;
  multi?: boolean;
}

const FormSelect = ({ form, name, options, label, multi = true }: Props) => {
  return (
    <form.Field name={name}>
      {(field: AnyFieldApi) => (
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">{label}</InputLabel>
          <Select
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            value={field.state.value}
            label={label}
            multiple={multi}
            MenuProps={{ sx: { maxHeight: "70vh" } }}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </form.Field>
  );
};

export default FormSelect;
