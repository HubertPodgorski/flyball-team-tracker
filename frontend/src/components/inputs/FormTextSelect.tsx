import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Autocomplete, TextField } from "@mui/material";
import { SelectOption } from "./types";

interface Props {
  options: SelectOption[];
  name: string;
  label: string;
}

const FormTextSelect = ({ options, name, label }: Props) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <Autocomplete
          onChange={(event, value: string) => onChange(value)}
          value={value}
          freeSolo
          options={options.map(({ value }) => value)}
          renderInput={(params) => (
            <TextField {...params} onChange={onChange} label={label} />
          )}
        />
      )}
    />
  );
};

export default FormTextSelect;
