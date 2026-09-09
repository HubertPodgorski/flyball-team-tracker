import React from "react";
import { TextField } from "@mui/material";
import type { AutocompleteRenderInputParams } from "@mui/material";

interface Props {
  params: AutocompleteRenderInputParams;
  label: string;
}

// readOnly by default - a fixed option list has nothing to type-filter, and an editable input just pops the mobile keyboard for nothing.
const PickListInput = ({ params, label }: Props) => (
  <TextField
    {...params}
    label={label}
    slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps?.htmlInput, readOnly: true } }}
  />
);

export default PickListInput;
