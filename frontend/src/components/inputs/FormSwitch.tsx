import { Box, Switch, Typography } from "@mui/material";
import React from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import { FormFieldProps } from "./utils";

interface Props extends FormFieldProps {
  label?: string;
}

const FormSwitch = ({ form, name, label }: Props) => (
  <form.Field name={name}>
    {(field: AnyFieldApi) => (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Switch
          onClick={() => field.handleChange(!field.state.value)}
          checked={!!field.state.value}
        />

        <Typography>{label}</Typography>
      </Box>
    )}
  </form.Field>
);

export default FormSwitch;
