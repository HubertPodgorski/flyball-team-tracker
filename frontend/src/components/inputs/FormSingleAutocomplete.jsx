import React from "react";
import { Autocomplete, createFilterOptions, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

const filter = createFilterOptions();

const FormSingleAutocomplete = ({
  options,
  name,
  label,
  onChange,
  value,
  required = false,
  rules,
}) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      rules={{ required, ...rules }}
      render={({ field: { onChange: formOnChange, value: formValue } }) => (
        <Autocomplete
          freeSolo
          fullWidth
          options={options}
          onChange={(event, newValue) => {
            let valueToSet = "";

            if (typeof newValue === "string") {
              valueToSet = newValue;
            } else if (newValue && newValue.inputValue) {
              // Create a new value from the user input
              valueToSet = newValue.inputValue;
            } else {
              valueToSet = newValue.value;
            }

            if (onChange) {
              onChange(valueToSet);
            } else {
              formOnChange(valueToSet);
            }
          }}
          value={value ? value : formValue}
          renderInput={(params) => (
            <TextField {...params} required={required} label={label} />
          )}
          componentsProps={{ popper: { sx: { maxHeight: "70vh" } } }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            const { inputValue } = params;
            // Suggest the creation of a new value
            const isExisting = options.some(
              (option) => inputValue === option.title
            );
            if (inputValue !== "" && !isExisting) {
              filtered.push({
                value: inputValue,
                label: `Add "${inputValue}"`,
              });
            }

            return filtered;
          }}
          getOptionLabel={(option) => {
            // Value selected with enter, right from the input
            if (typeof option === "string") {
              return option;
            }

            // Add "xxx" option created dynamically
            if (option.inputValue) {
              return option.inputValue;
            }

            // Regular option
            return option.label;
          }}
        />
      )}
    />
  );
};

export default FormSingleAutocomplete;
