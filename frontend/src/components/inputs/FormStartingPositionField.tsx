import React, { useId, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { FormFieldProps } from "./utils";
import ClearableTextField from "./ClearableTextField";
import { CM_OFFSETS, FOOT_OFFSETS, formatValue, parseValue, type Sign } from "../../helpers/startingPosition";

interface InnerProps {
  field: AnyFieldApi;
  label: string;
}

// Meter anchor +/- offset, time-picker style.
const FormStartingPositionFieldInner = ({ field, label }: InnerProps) => {
  const { t } = useTranslation();
  // Not `${label}-meters`/`${label}-offset` - aria-labelledby is a
  // space-separated list of ids, so an id built from label text containing
  // a space (e.g. "Starting position-meters") silently splits into two
  // bogus references and the Select ends up with no accessible name at all.
  const metersLabelId = useId();
  const offsetLabelId = useId();
  const value: string = field.state.value ?? "";
  const parsed = parseValue(value);

  // Fallback only - a parsed value's own sign wins once one exists.
  const [manualSign, setManualSign] = useState<Sign>("+");

  const meters = parsed?.meters ?? 0;
  const sign = parsed?.sign ?? manualSign;
  const offsetCm = parsed?.offsetCm ?? 0;

  const updateValue = (newMeters: number, newSign: Sign, newOffsetCm: number) => {
    field.handleChange(formatValue(newMeters, newSign, newOffsetCm));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", gap: 1, width: "100%", alignItems: "center" }}>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel id={metersLabelId}>{label}</InputLabel>
          <Select
            labelId={metersLabelId}
            label={label}
            value={meters}
            onChange={(event) => updateValue(Number(event.target.value), sign, offsetCm)}
          >
            {Array.from({ length: 21 }, (_, index) => (
              <MenuItem key={index} value={index}>
                {index}m
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={sign}
          exclusive
          size="small"
          onChange={(_event, newSign: Sign | null) => {
            if (!newSign) return;

            setManualSign(newSign);
            updateValue(meters, newSign, offsetCm);
          }}
        >
          <ToggleButton value="+">+</ToggleButton>
          <ToggleButton value="-">−</ToggleButton>
        </ToggleButtonGroup>

        <FormControl sx={{ flex: 1 }}>
          <InputLabel id={offsetLabelId}>{t("inputs.startingPosition.offset")}</InputLabel>
          <Select
            labelId={offsetLabelId}
            label={t("inputs.startingPosition.offset")}
            value={offsetCm}
            onChange={(event) => updateValue(meters, sign, Number(event.target.value))}
            MenuProps={{ sx: { maxHeight: "50vh" } }}
          >
            <MenuItem value={0}>—</MenuItem>

            <ListSubheader>{t("inputs.startingPosition.feet")}</ListSubheader>

            {FOOT_OFFSETS.map(({ cm, label: offsetLabel }) => (
              <MenuItem key={cm} value={cm}>
                {offsetLabel}
              </MenuItem>
            ))}

            <ListSubheader>{t("inputs.startingPosition.centimeters")}</ListSubheader>

            {CM_OFFSETS.map(({ cm, label: offsetLabel }) => (
              <MenuItem key={cm} value={cm}>
                {offsetLabel}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <ClearableTextField
        value={value}
        onChange={(newValue) => field.handleChange(newValue)}
        onBlur={field.handleBlur}
        placeholder={t("inputs.startingPosition.placeholder")}
        size="small"
      />
    </Box>
  );
};

const FormStartingPositionField = ({ form, name, label }: FormFieldProps & { label: string }) => (
  <form.Field name={name}>
    {(field: AnyFieldApi) => <FormStartingPositionFieldInner field={field} label={label} />}
  </form.Field>
);

export default FormStartingPositionField;
