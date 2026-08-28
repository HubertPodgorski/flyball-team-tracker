import { Box, Switch, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import React from "react";

interface Props {
  name: string;
  label?: string;
}

const FormSwitch = ({ name, label }: Props) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Switch
            onClick={() => field.onChange(!field.value)}
            checked={!!field.value}
          />

          <Typography>{label}</Typography>
        </Box>
      )}
    />
  );
};

export default FormSwitch;
