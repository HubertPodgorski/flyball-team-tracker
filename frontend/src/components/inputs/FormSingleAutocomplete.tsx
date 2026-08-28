import React from "react";
import { Autocomplete, createFilterOptions, TextField } from "@mui/material";
import type { AnyFieldApi } from "@tanstack/react-form";
import { FormFieldProps } from "./utils";
import { SelectOption } from "./types";

const filter = createFilterOptions<SelectOption>();

interface Props extends FormFieldProps {
  options: SelectOption[];
  label: string;
  required?: boolean;
}

const FormSingleAutocomplete = ({
  form,
  name,
  options,
  label,
  required = false,
}: Props) => (
  <form.Field
    name={name}
    validators={{
      onChange: ({ value }: { value: string }) =>
        required && !value ? "This field is required" : undefined,
    }}
  >
    {(field: AnyFieldApi) => (
      <Autocomplete<SelectOption, false, false, true>
        freeSolo
        fullWidth
        options={options}
        onChange={(event, newValue) => {
          const valueToSet =
            typeof newValue === "string" ? newValue : newValue?.value ?? "";

          field.handleChange(valueToSet);
        }}
        onBlur={field.handleBlur}
        value={field.state.value}
        renderInput={(params) => (
          <TextField {...params} required={required} label={label} />
        )}
        slotProps={{ popper: { sx: { maxHeight: "70vh" } } }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          const { inputValue } = params;
          // Suggest the creation of a new value
          const isExisting = options.some(
            (option) => inputValue === option.label
          );

          if (inputValue !== "" && !isExisting) {
            filtered.push({
              value: inputValue,
              label: `Add "${inputValue}"`,
            });
          }

          return filtered;
        }}
        getOptionLabel={(option) =>
          typeof option === "string" ? option : option.label
        }
      />
    )}
  </form.Field>
);

export default FormSingleAutocomplete;
