import React from "react";
import { IconButton, InputAdornment, TextField, TextFieldProps } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

interface Props extends Omit<TextFieldProps, "onChange"> {
  onChange: (value: string) => void;
  onClear?: () => void;
}

// Every free-text field gets an "x" to clear it.
const ClearableTextField = ({ value, onChange, onClear, slotProps, ...rest }: Props) => {
  const hasValue = !!value;

  return (
    <TextField
      {...rest}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        ...slotProps,
        input: {
          ...(typeof slotProps?.input === "object" ? slotProps.input : {}),
          endAdornment: hasValue ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                aria-label="Clear"
                onClick={() => (onClear ? onClear() : onChange(""))}
                // Align top for multiline, not centered.
                sx={{ alignSelf: rest.multiline ? "flex-start" : undefined }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
};

export default ClearableTextField;
