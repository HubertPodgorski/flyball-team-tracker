import React, { useId } from "react";
import { Autocomplete, Box, Chip, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import type { AnyFieldApi } from "@tanstack/react-form";
import { FormFieldProps } from "./utils";
import { SelectOption } from "./types";

interface Props extends FormFieldProps {
  options: SelectOption[];
  label: string;
  multi?: boolean;
}

const FormSelect = ({ form, name, options, label, multi = true }: Props) => {
  // Was a copy-pasted "demo-simple-select-label" never wired to the Select
  // via labelId - the Select had no accessible name at all (screen readers
  // and role-based test locators alike had nothing to match on).
  const labelId = useId();

  return (
    <form.Field name={name}>
      {(field: AnyFieldApi) => {
        // Autocomplete instead of a plain multi-select Select - closes like a normal combobox, doesn't cover the screen.
        if (multi) {
          const selectedValues: string[] = field.state.value ?? [];
          const selectedOptions = options.filter((option) =>
            selectedValues.includes(option.value)
          );

          return (
            <Autocomplete<SelectOption, true, false, false>
              multiple
              // Keep the dropdown open across multiple picks.
              disableCloseOnSelect
              options={options}
              value={selectedOptions}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              onChange={(_event, value) =>
                field.handleChange(value.map((option) => option.value))
              }
              onBlur={field.handleBlur}
              renderValue={(value, getItemProps) =>
                value.map((option, index) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- deliberately excluded from the spread below; we set our own `key`
                  const { key, ...itemProps } = getItemProps({ index });
                  return (
                    <Chip
                      label={option.label}
                      key={option.value}
                      color={option.color ?? "default"}
                      {...itemProps}
                    />
                  );
                })
              }
              renderOption={(props, option) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `key` must be pulled off and passed explicitly, not spread
                const { key, ...optionProps } = props;
                return (
                  <Box component="li" key={option.value} {...optionProps}>
                    {option.color && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: `${option.color}.main`,
                          marginRight: 1,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {option.label}
                  </Box>
                );
              }}
              renderInput={(params) => <TextField {...params} label={label} />}
            />
          );
        }

        return (
          <FormControl fullWidth>
            <InputLabel id={labelId}>{label}</InputLabel>
            <Select
              labelId={labelId}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              value={field.state.value}
              label={label}
              MenuProps={{ sx: { maxHeight: "70vh" } }}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }}
    </form.Field>
  );
};

export default FormSelect;
